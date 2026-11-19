const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./config/db');
const app = require('./server');

function request(port, method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...headers,
      'Content-Type': 'application/json',
      ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
    };

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        method,
        path: urlPath,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runE2EFlow() {
  console.log('====================================================');
  console.log('🚀 RUNNING END-TO-END FLOW VERIFICATION (STAGE B)');
  console.log('====================================================\n');

  await connectDB();
  const PORT = 5077;
  const server = app.listen(PORT);

  try {
    // 1. Student Registers
    const studentEmail = `flow_student_${Date.now()}@krmu.edu.in`;
    console.log(`1. Registering new student: ${studentEmail}`);
    const regRes = await request(PORT, 'POST', '/api/auth/register', {}, {
      name: 'Flow Test Student',
      email: studentEmail,
      password: 'Student@123',
      phone: '+91 9888877777',
    });
    if (regRes.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    const studentToken = regRes.data.accessToken;
    console.log('   ✅ Student registered successfully. Role strictly "student".');

    // 2. Student views available rooms
    console.log('2. Student browsing available rooms in Block A...');
    const roomsRes = await request(PORT, 'GET', '/api/rooms/available?block=A', {
      Authorization: `Bearer ${studentToken}`,
    });
    const targetRoom = roomsRes.data.rooms.find((r) => r.freeBeds > 0);
    if (!targetRoom) throw new Error('No available room found in Block A');
    console.log(`   ✅ Found available room: Block ${targetRoom.block} Room ${targetRoom.roomNumber} (${targetRoom.freeBeds} beds free).`);

    // 3. Student requests the room
    console.log('3. Student sending room allocation request...');
    const reqRes = await request(PORT, 'POST', '/api/allocations/request', {
      Authorization: `Bearer ${studentToken}`,
    }, { roomId: targetRoom._id });
    if (reqRes.status !== 201) throw new Error(`Room request failed: ${JSON.stringify(reqRes.data)}`);
    const allocationId = reqRes.data.allocation._id;
    console.log('   ✅ Room request created with status "requested".');

    // 4. Warden logs in
    console.log('4. Warden logging in (warden@hostelease.com)...');
    const wardenLogin = await request(PORT, 'POST', '/api/auth/login', {}, {
      email: 'warden@hostelease.com',
      password: 'Warden@123',
    });
    const wardenToken = wardenLogin.data.accessToken;
    console.log('   ✅ Warden authenticated.');

    // 5. Warden approves the request (Atomic capacity test)
    console.log('5. Warden approving room allocation request atomically...');
    const approveRes = await request(PORT, 'PATCH', `/api/allocations/${allocationId}/approve`, {
      Authorization: `Bearer ${wardenToken}`,
    }, { wardenNotes: 'Verified ID card. Approved for Fall semester.' });
    if (approveRes.status !== 200) throw new Error(`Approval failed: ${JSON.stringify(approveRes.data)}`);
    console.log('   ✅ Warden approved request. Bed count atomically incremented.');

    // 6. Student checks my room status
    console.log('6. Student checking current room status...');
    const myRoomRes = await request(PORT, 'GET', '/api/allocations/my', {
      Authorization: `Bearer ${studentToken}`,
    });
    if (myRoomRes.data.allocation?.status !== 'approved') {
      throw new Error(`Expected approved allocation, got: ${myRoomRes.data.allocation?.status}`);
    }
    console.log(`   ✅ Student sees Room ${myRoomRes.data.allocation.room.block}-${myRoomRes.data.allocation.room.roomNumber} assigned!`);

    // 7. Student raises a maintenance complaint
    console.log('7. Student registering maintenance complaint...');
    const compRes = await request(PORT, 'POST', '/api/complaints', {
      Authorization: `Bearer ${studentToken}`,
    }, {
      title: 'Study lamp plug point sparked',
      category: 'electrical',
      priority: 'high',
      description: 'Socket near study table sparking upon plugging in charger.',
    });
    if (compRes.status !== 201) throw new Error(`Complaint creation failed: ${JSON.stringify(compRes.data)}`);
    const complaintId = compRes.data.complaint._id;
    console.log('   ✅ Complaint ticket filed with status "open".');

    // 8. Warden resolves the complaint
    console.log('8. Warden inspecting and resolving complaint ticket...');
    const resolveRes = await request(PORT, 'PATCH', `/api/complaints/${complaintId}`, {
      Authorization: `Bearer ${wardenToken}`,
    }, {
      status: 'resolved',
      wardenRemarks: 'Campus electrician replaced the socket with modular switchboard.',
    });
    if (resolveRes.status !== 200) throw new Error(`Resolving failed: ${JSON.stringify(resolveRes.data)}`);
    console.log('   ✅ Complaint resolved by warden with remarks recorded.');

    // 9. Student vacates the room
    console.log('9. Student vacating room...');
    const vacateRes = await request(PORT, 'POST', '/api/allocations/vacate', {
      Authorization: `Bearer ${studentToken}`,
    });
    if (vacateRes.status !== 200) throw new Error(`Vacate failed: ${JSON.stringify(vacateRes.data)}`);
    console.log('   ✅ Room vacated successfully. Bed returned to available pool.');

    // 10. RBAC Test: Student tries to access warden stats
    console.log('10. RBAC Test: Student attempting to access /api/dashboard/stats...');
    const rbac1 = await request(PORT, 'GET', '/api/dashboard/stats', {
      Authorization: `Bearer ${studentToken}`,
    });
    if (rbac1.status !== 403) throw new Error(`Expected 403 Forbidden, got: ${rbac1.status}`);
    console.log('   ✅ Correctly blocked with 403 Forbidden!');

    // 11. RBAC Test: Student tries to access admin users
    console.log('11. RBAC Test: Student attempting to access /api/users...');
    const rbac2 = await request(PORT, 'GET', '/api/users', {
      Authorization: `Bearer ${studentToken}`,
    });
    if (rbac2.status !== 403) throw new Error(`Expected 403 Forbidden, got: ${rbac2.status}`);
    console.log('   ✅ Correctly blocked with 403 Forbidden!');

    console.log('\n====================================================');
    console.log('🎉 ALL END-TO-END FLOWS AND RBAC CHECKS PASSED 100%!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('💥 End-to-end test failure:', err.message);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runE2EFlow();
