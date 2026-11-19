const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./server');

// Helper for making HTTP requests in Node using standard http module (no extra runtime dependencies)
function makeRequest(port, method, path, headers = {}, body = null) {
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
        path,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, headers: res.headers, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, raw: data });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runAllApiTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE BACKEND API TEST SUITE');
  console.log('====================================================\n');

  // Start server and connect to MongoDB
  const connectDB = require('./config/db');
  await connectDB();
  const TEST_PORT = 5055;
  const server = app.listen(TEST_PORT);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extra = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${extra}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await makeRequest(TEST_PORT, 'GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'GET /api/health');

    // 2. Auth - Login as Admin
    const adminLogin = await makeRequest(TEST_PORT, 'POST', '/api/auth/login', {}, {
      email: 'admin@hostelease.com',
      password: 'Admin@123',
    });
    assert(adminLogin.status === 200 && adminLogin.data.accessToken, 'POST /api/auth/login (Admin)');
    const adminToken = adminLogin.data.accessToken;

    // 3. Auth - Login as Warden
    const wardenLogin = await makeRequest(TEST_PORT, 'POST', '/api/auth/login', {}, {
      email: 'warden@hostelease.com',
      password: 'Warden@123',
    });
    assert(wardenLogin.status === 200 && wardenLogin.data.accessToken, 'POST /api/auth/login (Warden)');
    const wardenToken = wardenLogin.data.accessToken;

    // 4. Auth - Login as Existing Student
    const studentLogin = await makeRequest(TEST_PORT, 'POST', '/api/auth/login', {}, {
      email: 'student1@krmu.edu.in',
      password: 'Student@123',
    });
    assert(studentLogin.status === 200 && studentLogin.data.accessToken, 'POST /api/auth/login (Student)');
    const student1Token = studentLogin.data.accessToken;
    const student1Refresh = studentLogin.data.refreshToken;

    // 5. Auth - Register a NEW student
    const testEmail = `newstudent_${Date.now()}@krmu.edu.in`;
    const studentRegister = await makeRequest(TEST_PORT, 'POST', '/api/auth/register', {}, {
      name: 'Test New Student',
      email: testEmail,
      password: 'Student@123',
      phone: '+91 9999988888',
    });
    assert(studentRegister.status === 201 && studentRegister.data.user.role === 'student', 'POST /api/auth/register (Role is strictly student)');
    const newStudentToken = studentRegister.data.accessToken;

    // 6. Auth - Refresh Token
    const refreshRes = await makeRequest(TEST_PORT, 'POST', '/api/auth/refresh', {}, {
      refreshToken: student1Refresh,
    });
    assert(refreshRes.status === 200 && refreshRes.data.accessToken, 'POST /api/auth/refresh (Silent Refresh)');

    // 7. Auth - GET /api/auth/me
    const meRes = await makeRequest(TEST_PORT, 'GET', '/api/auth/me', {
      Authorization: `Bearer ${newStudentToken}`,
    });
    assert(meRes.status === 200 && meRes.data.user.email === testEmail, 'GET /api/auth/me');

    // 8. Rooms - GET /api/rooms/available (Accessible by student)
    const availRes = await makeRequest(TEST_PORT, 'GET', '/api/rooms/available?block=A', {
      Authorization: `Bearer ${newStudentToken}`,
    });
    assert(availRes.status === 200 && Array.isArray(availRes.data.rooms), 'GET /api/rooms/available?block=A');
    const targetRoom = availRes.data.rooms[0];
    assert(targetRoom && targetRoom.freeBeds > 0, 'Found available room with free beds');

    // 9. RBAC Test: Student should get 403 when trying to access Warden/Admin routes
    const rbacTest1 = await makeRequest(TEST_PORT, 'GET', '/api/dashboard/stats', {
      Authorization: `Bearer ${newStudentToken}`,
    });
    assert(rbacTest1.status === 403, 'RBAC check: Student gets 403 on GET /api/dashboard/stats');

    const rbacTest2 = await makeRequest(TEST_PORT, 'GET', '/api/users', {
      Authorization: `Bearer ${wardenToken}`,
    });
    assert(rbacTest2.status === 403, 'RBAC check: Warden gets 403 on GET /api/users (Admin-only)');

    // 10. Dashboard - GET /api/dashboard/stats (Warden)
    const dashRes = await makeRequest(TEST_PORT, 'GET', '/api/dashboard/stats', {
      Authorization: `Bearer ${wardenToken}`,
    });
    assert(
      dashRes.status === 200 &&
      dashRes.data.data.occupancyByBlock.length > 0 &&
      dashRes.data.data.complaintsByCategory.length > 0 &&
      dashRes.data.data.roomMap.length > 0,
      'GET /api/dashboard/stats (Aggregations and Room Map)'
    );

    // 11. Allocation - Student requests room
    const reqRes = await makeRequest(TEST_PORT, 'POST', '/api/allocations/request', {
      Authorization: `Bearer ${newStudentToken}`,
    }, {
      roomId: targetRoom._id,
    });
    assert(reqRes.status === 201 && reqRes.data.allocation.status === 'requested', 'POST /api/allocations/request');
    const allocationId = reqRes.data.allocation._id;

    // 12. Allocation - Duplicate request should FAIL (Enforces one active request/room rule)
    const dupRes = await makeRequest(TEST_PORT, 'POST', '/api/allocations/request', {
      Authorization: `Bearer ${newStudentToken}`,
    }, {
      roomId: targetRoom._id,
    });
    assert(dupRes.status === 400, 'Rule Enforcement: Duplicate request fails with 400');

    // 13. Allocation - Student views current request status
    const myAlloc = await makeRequest(TEST_PORT, 'GET', '/api/allocations/my', {
      Authorization: `Bearer ${newStudentToken}`,
    });
    assert(myAlloc.status === 200 && myAlloc.data.allocation.status === 'requested', 'GET /api/allocations/my');

    // 14. Allocation - Warden views allocations list
    const allAlloc = await makeRequest(TEST_PORT, 'GET', '/api/allocations?status=requested', {
      Authorization: `Bearer ${wardenToken}`,
    });
    assert(allAlloc.status === 200 && allAlloc.data.allocations.length > 0, 'GET /api/allocations');

    // 15. Allocation - Warden approves request (Atomic capacity increment)
    const approveRes = await makeRequest(TEST_PORT, 'PATCH', `/api/allocations/${allocationId}/approve`, {
      Authorization: `Bearer ${wardenToken}`,
    }, {
      wardenNotes: 'Verified documents and approved room allotment.',
    });
    assert(approveRes.status === 200 && approveRes.data.allocation.status === 'approved', 'PATCH /api/allocations/:id/approve (Atomic bed taken)');

    // 16. Allocation - Student vacates room (Atomic bed freed)
    const vacateRes = await makeRequest(TEST_PORT, 'POST', '/api/allocations/vacate', {
      Authorization: `Bearer ${newStudentToken}`,
    });
    assert(vacateRes.status === 200 && vacateRes.data.allocation.status === 'vacated', 'POST /api/allocations/vacate (Room vacated)');

    // 17. Complaints - Student raises complaint
    const compRes = await makeRequest(TEST_PORT, 'POST', '/api/complaints', {
      Authorization: `Bearer ${newStudentToken}`,
    }, {
      title: 'Water pressure low in 2nd floor bathroom',
      category: 'plumbing',
      priority: 'medium',
      description: 'Water flow is very slow since this morning.',
    });
    assert(compRes.status === 201 && compRes.data.complaint.status === 'open', 'POST /api/complaints (Student raises complaint)');
    const complaintId = compRes.data.complaint._id;

    // 18. Complaints - Student views their complaints
    const myComp = await makeRequest(TEST_PORT, 'GET', '/api/complaints/my', {
      Authorization: `Bearer ${newStudentToken}`,
    });
    assert(myComp.status === 200 && myComp.data.complaints.length > 0, 'GET /api/complaints/my');

    // 19. Complaints - Warden views all complaints and updates status
    const updateComp = await makeRequest(TEST_PORT, 'PATCH', `/api/complaints/${complaintId}`, {
      Authorization: `Bearer ${wardenToken}`,
    }, {
      status: 'in-progress',
      wardenRemarks: 'Plumber inspected the main valve.',
    });
    assert(updateComp.status === 200 && updateComp.data.complaint.status === 'in-progress', 'PATCH /api/complaints/:id (Warden updates status & remarks)');

    // 20. Rooms - Warden creates a new room
    const testRoomNum = `99${Math.floor(Math.random() * 90 + 10)}`;
    const createRoomRes = await makeRequest(TEST_PORT, 'POST', '/api/rooms', {
      Authorization: `Bearer ${wardenToken}`,
    }, {
      roomNumber: testRoomNum,
      block: 'A',
      floor: 4,
      capacity: 2,
    });
    assert(createRoomRes.status === 201 && createRoomRes.data.room.roomNumber === testRoomNum, 'POST /api/rooms (Warden creates room)');
    const createdRoomId = createRoomRes.data.room._id;

    // 21. Rooms - Warden updates room to maintenance
    const updateRoomRes = await makeRequest(TEST_PORT, 'PATCH', `/api/rooms/${createdRoomId}`, {
      Authorization: `Bearer ${wardenToken}`,
    }, {
      status: 'maintenance',
    });
    assert(updateRoomRes.status === 200 && updateRoomRes.data.room.status === 'maintenance', 'PATCH /api/rooms/:id (Update maintenance status)');

    // 22. Rooms - Admin deletes empty room
    const delRoomRes = await makeRequest(TEST_PORT, 'DELETE', `/api/rooms/${createdRoomId}`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(delRoomRes.status === 200, 'DELETE /api/rooms/:id (Admin deletes empty room)');

    // 23. Users - Admin views all users
    const allUsersRes = await makeRequest(TEST_PORT, 'GET', '/api/users', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(allUsersRes.status === 200 && allUsersRes.data.users.length > 50, 'GET /api/users (Admin lists all users)');

    // 24. Users - Admin updates user role
    const roleUpdateRes = await makeRequest(TEST_PORT, 'PATCH', `/api/users/${studentRegister.data.user._id}/role`, {
      Authorization: `Bearer ${adminToken}`,
    }, {
      role: 'warden',
    });
    assert(roleUpdateRes.status === 200 && roleUpdateRes.data.user.role === 'warden', 'PATCH /api/users/:id/role (Admin updates role)');

  } catch (err) {
    console.error('💥 Test suite error:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n====================================================');
    console.log(`🏁 API TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAllApiTests();
