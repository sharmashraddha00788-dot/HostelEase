const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const User = require('./models/User');
const Room = require('./models/Room');
const Allocation = require('./models/Allocation');
const Complaint = require('./models/Complaint');

// Fallback student data if randomuser.me API is offline or slow
const fallbackStudents = [
  { name: 'Aarav Patel', email: 'aarav.patel@hostel.krmu.edu', phone: '+91 9811122331' },
  { name: 'Diya Sharma', email: 'diya.sharma@hostel.krmu.edu', phone: '+91 9811122332' },
  { name: 'Rohan Gupta', email: 'rohan.gupta@hostel.krmu.edu', phone: '+91 9811122333' },
  { name: 'Ananya Verma', email: 'ananya.verma@hostel.krmu.edu', phone: '+91 9811122334' },
  { name: 'Kabir Singh', email: 'kabir.singh@hostel.krmu.edu', phone: '+91 9811122335' },
  { name: 'Ishaan Reddy', email: 'ishaan.reddy@hostel.krmu.edu', phone: '+91 9811122336' },
  { name: 'Meera Iyer', email: 'meera.iyer@hostel.krmu.edu', phone: '+91 9811122337' },
  { name: 'Aditya Rao', email: 'aditya.rao@hostel.krmu.edu', phone: '+91 9811122338' },
  { name: 'Rhea Nair', email: 'rhea.nair@hostel.krmu.edu', phone: '+91 9811122339' },
  { name: 'Arjun Sen', email: 'arjun.sen@hostel.krmu.edu', phone: '+91 9811122340' },
  { name: 'Saanvi Joshi', email: 'saanvi.joshi@hostel.krmu.edu', phone: '+91 9811122341' },
  { name: 'Vivaan Kapoor', email: 'vivaan.kapoor@hostel.krmu.edu', phone: '+91 9811122342' },
  { name: 'Pari Malhotra', email: 'pari.malhotra@hostel.krmu.edu', phone: '+91 9811122343' },
  { name: 'Reyansh Bhatia', email: 'reyansh.bhatia@hostel.krmu.edu', phone: '+91 9811122344' },
  { name: 'Kavya Pillai', email: 'kavya.pillai@hostel.krmu.edu', phone: '+91 9811122345' },
  { name: 'Tanvi Saxena', email: 'tanvi.saxena@hostel.krmu.edu', phone: '+91 9811122346' },
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is missing in environment variables');
    }

    console.log('[Seed] Connecting to MongoDB...');
    const conn = await mongoose.connect(mongoUri);
    const dbName = conn.connection.name;

    console.log(`[Seed] Connected to database: ${dbName}`);

    // MANDATORY REQUIREMENT:
    // "The seed script must REFUSE to run if the connected database name is 'test'"
    if (dbName === 'test') {
      console.error(
        '❌ ERROR: Seed script refused to run! Connected to "test" database instead of "hostelease".'
      );
      console.error('Please ensure MONGO_URI ends with /hostelease');
      process.exit(1);
    }

    // MANDATORY REQUIREMENT:
    // Drop existing database / collections to purge stale data and stale indexes
    console.log('[Seed] Clearing existing collections to prevent stale indexes and conflicts...');
    try {
      await conn.connection.dropDatabase();
      console.log('[Seed] Database dropped successfully.');
    } catch (dropDbErr) {
      console.log('[Seed] Note: dropDatabase not permitted by user role. Dropping individual collections instead...');
      const collections = await conn.connection.db.listCollections().toArray();
      for (const coll of collections) {
        try {
          await conn.connection.db.dropCollection(coll.name);
          console.log(`[Seed] Dropped collection: ${coll.name}`);
        } catch (e) {
          await conn.connection.db.collection(coll.name).deleteMany({});
        }
      }
    }

    // 1. Create Admin and Warden Accounts
    console.log('[Seed] Creating Admin and Warden accounts...');
    // Note: Pass plain-text passwords so Mongoose pre('save') hashes them exactly once
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@hostelease.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 9876543210',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    const warden = await User.create({
      name: 'Head Warden Sharma',
      email: 'warden@hostelease.com',
      password: 'Warden@123',
      role: 'warden',
      phone: '+91 9876543211',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    });

    // 2. Create Rooms
    // 2 blocks ('A' and 'B') x 3 floors (1, 2, 3) x 5 rooms (01..05)
    // Mixed capacities (2 or 3 beds), 2 rooms under maintenance (A-305 and B-205)
    console.log('[Seed] Creating 30 hostel rooms across Blocks A & B...');
    const blocks = ['A', 'B'];
    const floors = [1, 2, 3];
    const createdRooms = [];

    for (const block of blocks) {
      for (const floor of floors) {
        for (let r = 1; r <= 5; r++) {
          const roomNumber = `${floor}0${r}`;
          // Alternate capacity: 2 and 3
          const capacity = r % 2 === 0 ? 3 : 2;

          // 2 rooms in maintenance
          const isMaintenance =
            (block === 'A' && roomNumber === '305') ||
            (block === 'B' && roomNumber === '205');

          const room = await Room.create({
            roomNumber,
            block,
            floor,
            capacity,
            occupied: 0,
            status: isMaintenance ? 'maintenance' : 'available',
          });
          createdRooms.push(room);
        }
      }
    }
    console.log(`[Seed] Created ${createdRooms.length} rooms.`);

    // 3. Fetch ~56 Students from randomuser.me API
    console.log('[Seed] Fetching 56 Indian students from randomuser.me API...');
    let studentDataList = [];

    try {
      const response = await fetch(
        'https://randomuser.me/api/?results=56&nat=in&seed=hostelease&inc=name,email,phone,picture',
        { signal: AbortSignal.timeout(10000) }
      );
      if (response.ok) {
        const json = await response.json();
        studentDataList = json.results.map((item, idx) => ({
          name: `${item.name.first} ${item.name.last}`,
          email: `student${idx + 1}@krmu.edu.in`,
          phone: item.phone || `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
          avatar: item.picture.large || '',
        }));
        console.log(`[Seed] Fetched ${studentDataList.length} students from randomuser.me`);
      }
    } catch (apiErr) {
      console.warn(`[Seed] randomuser.me API request failed (${apiErr.message}). Using fallback student list.`);
      for (let i = 0; i < 56; i++) {
        const base = fallbackStudents[i % fallbackStudents.length];
        studentDataList.push({
          name: `${base.name} ${i + 1}`,
          email: `student${i + 1}@krmu.edu.in`,
          phone: base.phone,
          avatar: '',
        });
      }
    }

    // Save students in database (password is hashed by pre-save hook)
    console.log('[Seed] Inserting students into database...');
    const createdStudents = [];
    for (const item of studentDataList) {
      const student = await User.create({
        name: item.name,
        email: item.email,
        password: 'Student@123',
        role: 'student',
        phone: item.phone,
        avatar: item.avatar,
      });
      createdStudents.push(student);
    }
    console.log(`[Seed] Created ${createdStudents.length} students with password "Student@123".`);

    // 4. Create ~48 Approved Allotments distributed across both Block A and Block B
    console.log('[Seed] Creating 48 approved allotments distributed across blocks...');
    const blockARooms = createdRooms.filter((r) => r.block === 'A' && r.status === 'available');
    const blockBRooms = createdRooms.filter((r) => r.block === 'B' && r.status === 'available');

    let studentIndex = 0;
    const approvedAllocations = [];

    // Allot 24 students in Block A
    for (const room of blockARooms) {
      // Leave last 3 rooms empty and some partially filled
      const fillLimit = room.roomNumber.endsWith('01') || room.roomNumber.endsWith('02') || room.roomNumber.endsWith('03')
        ? room.capacity
        : 1;

      while (room.occupied < fillLimit && studentIndex < 24) {
        const student = createdStudents[studentIndex];
        room.occupied += 1;

        const allocation = await Allocation.create({
          student: student._id,
          room: room._id,
          status: 'approved',
          requestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          allottedDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
          wardenNotes: 'Allotted during orientation.',
        });

        student.room = room._id;
        await student.save();
        approvedAllocations.push(allocation);
        studentIndex++;
      }
      await room.save();
    }

    // Allot 24 students in Block B
    for (const room of blockBRooms) {
      const fillLimit = room.roomNumber.endsWith('01') || room.roomNumber.endsWith('02') || room.roomNumber.endsWith('03')
        ? room.capacity
        : 1;

      while (room.occupied < fillLimit && studentIndex < 48) {
        const student = createdStudents[studentIndex];
        room.occupied += 1;

        const allocation = await Allocation.create({
          student: student._id,
          room: room._id,
          status: 'approved',
          requestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          allottedDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
          wardenNotes: 'Allotted during orientation.',
        });

        student.room = room._id;
        await student.save();
        approvedAllocations.push(allocation);
        studentIndex++;
      }
      await room.save();
    }
    console.log(`[Seed] Created ${approvedAllocations.length} approved room allocations.`);

    // 5. Create a few Pending Requests (for remaining students)
    console.log('[Seed] Creating 4 pending room requests...');
    const roomsWithBeds = createdRooms.filter(
      (r) => r.status === 'available' && r.occupied < r.capacity
    );

    for (let i = 0; i < 4 && studentIndex < createdStudents.length; i++) {
      const student = createdStudents[studentIndex];
      const targetRoom = roomsWithBeds[i % roomsWithBeds.length];

      await Allocation.create({
        student: student._id,
        room: targetRoom._id,
        status: 'requested',
        requestDate: new Date(Date.now() - (i + 1) * 3600 * 1000),
      });
      studentIndex++;
    }

    // 6. Create ~14 Sample Complaints
    console.log('[Seed] Creating 14 sample maintenance complaints in mixed statuses...');
    const sampleComplaints = [
      {
        title: 'Bathroom tap constantly dripping',
        category: 'plumbing',
        priority: 'medium',
        description: 'Washroom tap in attached toilet is leaking constantly, causing water wastage and noise.',
        status: 'open',
      },
      {
        title: 'Ceiling fan makes loud grinding noise',
        category: 'electrical',
        priority: 'high',
        description: 'Fan bearing seems damaged, vibrating and producing clicking sound at high speed.',
        status: 'in-progress',
        wardenRemarks: 'Electrician requested from campus maintenance. Expected visit by 3 PM.',
      },
      {
        title: 'Corridor Wi-Fi access point unreachable',
        category: 'internet',
        priority: 'high',
        description: 'Wi-Fi disconnects frequently on 2nd floor wing. Signal drops completely inside room.',
        status: 'open',
      },
      {
        title: 'Study chair castor wheel broken',
        category: 'furniture',
        priority: 'low',
        description: 'One of the roller wheels on the desk chair has snapped off.',
        status: 'resolved',
        wardenRemarks: 'Replacement study chair issued from hostel store.',
      },
      {
        title: 'Floor corridor trash bin overflowing',
        category: 'cleaning',
        priority: 'medium',
        description: 'Main bin near the elevator has not been emptied since yesterday evening.',
        status: 'resolved',
        wardenRemarks: 'Housekeeping team dispatched and area sanitized.',
      },
      {
        title: 'Geyser not heating water in the morning',
        category: 'electrical',
        priority: 'high',
        description: 'Geyser indicator turns on but water stays cold even after 20 minutes.',
        status: 'open',
      },
      {
        title: 'Window latch loose and rattling in wind',
        category: 'other',
        priority: 'low',
        description: 'The aluminum latch on the eastern window does not lock securely.',
        status: 'in-progress',
        wardenRemarks: 'Carpenter notified to replace the latch bracket.',
      },
      {
        title: 'Clogged shower drainage basin',
        category: 'plumbing',
        priority: 'high',
        description: 'Water backs up in the shower stall during bath and drains very slowly.',
        status: 'open',
      },
      {
        title: 'LAN Ethernet port on wall loose',
        category: 'internet',
        priority: 'medium',
        description: 'RJ45 wall socket is recessed inside the switchboard and cable disconnects.',
        status: 'in-progress',
        wardenRemarks: 'IT technician assigned ticket #IT-449.',
      },
      {
        title: 'Wardrobe door hinges loose',
        category: 'furniture',
        priority: 'low',
        description: 'Left door of the wooden wardrobe drags against the bottom frame.',
        status: 'resolved',
        wardenRemarks: 'Tightened hinges and leveled door alignment.',
      },
      {
        title: 'Fluorescent tube light flickering',
        category: 'electrical',
        priority: 'medium',
        description: 'Main tube light flickers rapidly causing eye strain during study hours.',
        status: 'resolved',
        wardenRemarks: 'Flickering starter and tube replaced with new LED fixture.',
      },
      {
        title: 'Balcony drainage blocked with dry leaves',
        category: 'cleaning',
        priority: 'low',
        description: 'Dry leaves accumulated after wind, preventing rainwater runoff.',
        status: 'open',
      },
      {
        title: 'Water filter near water cooler tasting strange',
        category: 'other',
        priority: 'medium',
        description: 'Water from the 1st floor cooler tastes stale; RO filter may need servicing.',
        status: 'open',
      },
      {
        title: 'Bed frame corner bolt missing',
        category: 'furniture',
        priority: 'low',
        description: 'Bed squeaks when moving due to loose corner joint bolt.',
        status: 'in-progress',
        wardenRemarks: 'Hardware bolt requisition placed with facility team.',
      },
    ];

    for (let i = 0; i < sampleComplaints.length; i++) {
      const comp = sampleComplaints[i];
      const student = createdStudents[i % 20]; // pick among the first 20 students
      await Complaint.create({
        ...comp,
        student: student._id,
        room: student.room || null,
        wardenRemarks: comp.wardenRemarks || '',
      });
    }
    console.log(`[Seed] Created ${sampleComplaints.length} sample complaints.`);

    console.log('\n=========================================');
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=========================================');
    console.log('📌 Logins for Demo:');
    console.log('  👑 Admin:   admin@hostelease.com / Admin@123');
    console.log('  🛡️ Warden:  warden@hostelease.com / Warden@123');
    console.log('  🎓 Student: student1@krmu.edu.in / Student@123');
    console.log(`  🎓 Unallotted Student (for testing): student${studentIndex + 1}@krmu.edu.in / Student@123`);
    console.log('=========================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
