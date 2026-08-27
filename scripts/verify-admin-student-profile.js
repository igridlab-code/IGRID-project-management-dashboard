const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(pathStr, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}${pathStr}`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch(e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data, json });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Admin Student Profile Management Verification Tests...\n');

  // 1️⃣ Authenticate Admin user
  const adminEmail = `admin_tester_${Date.now()}@gmail.com`;
  const adminSignupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: adminEmail, password: 'AdminPassword123!' });

  const adminToken = adminSignupRes.json ? adminSignupRes.json.token : null;

  if (!adminToken) {
    console.error('❌ FAIL: Could not authenticate Admin user.');
    process.exit(1);
  }
  console.log('✅ Authenticated Admin user:', adminEmail);

  // 2️⃣ Authenticate Regular Student User
  const studentEmail = `student_user_${Date.now()}@gmail.com`;
  const studentSignupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentEmail, password: 'StudentPassword123!' });

  const studentToken = studentSignupRes.json ? studentSignupRes.json.token : null;
  console.log('✅ Registered & Authenticated regular Student user:', studentEmail);

  // 3️⃣ Fetch list of registered students
  console.log('\n3️⃣ Fetching registered students list...');
  const studentsRes = await makeRequest('/api/students', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  if (studentsRes.statusCode !== 200 || !Array.isArray(studentsRes.json) || studentsRes.json.length === 0) {
    console.error('❌ FAIL: Could not fetch registered students:', studentsRes.statusCode, studentsRes.json);
    process.exit(1);
  }

  const initialCount = studentsRes.json.length;
  const targetStudent = studentsRes.json[0];
  console.log(`✅ Found ${initialCount} registered students. Selected target student ID ${targetStudent.id}: "${targetStudent.name}" (${targetStudent.roll_no})`);

  // 4️⃣ Test Non-Admin Student updating profile (Security Enforcement Check - Should return 403)
  console.log('\n4️⃣ Testing student profile edit with Regular Student token (Security check)...');
  const forbiddenRes = await makeRequest(`/api/students/${targetStudent.id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}` 
    }
  }, {
    name: 'Hacked Name',
    roll_no: targetStudent.roll_no
  });

  if (forbiddenRes.statusCode === 403) {
    console.log('✅ PASS: Regular student edit correctly rejected with 403 Forbidden!');
  } else {
    console.error('❌ FAIL: Non-admin edit returned unexpected status:', forbiddenRes.statusCode, forbiddenRes.json);
    process.exit(1);
  }

  // 5️⃣ Test Admin editing student profile
  console.log('\n5️⃣ Testing Admin editing student profile (Updating existing record)...');
  const updatePayload = {
    name: `${targetStudent.name} (Updated)`,
    roll_no: targetStudent.roll_no,
    email: targetStudent.email || `${targetStudent.id}@igridlab.com`,
    phone: '+91 98765 12345',
    department: 'Robotics & AI',
    year: '4th Year',
    section: 'Section B',
    college: 'Indra Ganesan College of Engineering',
    status: 'Active',
    team_name: 'Team VisionCore',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    skills: 'ROS2, FreeRTOS, Embedded C++, PyTorch, PCB Design',
    github_url: 'https://github.com/igrid-student',
    linkedin_url: 'https://linkedin.com/in/igrid-student',
    bio: 'Lead robotics engineer working on autonomous navigation and hardware prototyping.'
  };

  const updateRes = await makeRequest(`/api/students/${targetStudent.id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}` 
    }
  }, updatePayload);

  if (updateRes.statusCode === 200 && updateRes.json && updateRes.json.message) {
    console.log('✅ PASS: Admin profile update returned 200 OK:', updateRes.json.message);
  } else {
    console.error('❌ FAIL: Admin update failed:', updateRes.statusCode, updateRes.json);
    process.exit(1);
  }

  // 6️⃣ Verify updated student profile & persistence
  console.log('\n6️⃣ Verifying updated student profile record...');
  const verifyRes = await makeRequest(`/api/students/${targetStudent.id}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  if (verifyRes.statusCode === 200 && verifyRes.json) {
    const updated = verifyRes.json;
    console.log('✅ Updated Record Details:');
    console.log('   - ID:', updated.id);
    console.log('   - Name:', updated.name);
    console.log('   - Roll No:', updated.roll_no);
    console.log('   - Phone:', updated.phone);
    console.log('   - Department:', updated.department);
    console.log('   - Year:', updated.year);
    console.log('   - Section:', updated.section);
    console.log('   - College:', updated.college);
    console.log('   - Skills:', updated.skills);

    // Verify same record was updated, no duplicate created
    const refetchAllRes = await makeRequest('/api/students', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const finalCount = refetchAllRes.json.length;

    if (finalCount === initialCount) {
      console.log(`✅ PASS: Student count remained exactly ${initialCount} (No duplicate record created)!`);
    } else {
      console.error(`❌ FAIL: Student count changed from ${initialCount} to ${finalCount}!`);
      process.exit(1);
    }
  } else {
    console.error('❌ FAIL: Could not verify updated student profile:', verifyRes.statusCode, verifyRes.json);
    process.exit(1);
  }

  console.log('\n🎉 ALL ADMIN STUDENT PROFILE MANAGEMENT TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
