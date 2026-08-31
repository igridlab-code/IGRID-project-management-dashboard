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

  // 1️⃣ Authenticate Admin User
  let adminToken = null;
  let adminRes = await makeRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@igridlab.edu.in', password: 'Admin@123' });

  if (adminRes.statusCode === 200 && adminRes.json && adminRes.json.token) {
    adminToken = adminRes.json.token;
  } else {
    adminRes = await makeRequest('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: `admin_tester_${Date.now()}@gmail.com`, password: 'AdminPassword123!', role: 'admin' });
    adminToken = adminRes.json ? adminRes.json.token : null;
  }

  if (!adminToken) {
    console.error('❌ FAIL: Could not authenticate admin user:', adminRes.statusCode, adminRes.json);
    process.exit(1);
  }
  console.log('✅ Authenticated Admin User.');

  // 2️⃣ Authenticate Non-Admin Student User
  const studentUserRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: `student_user_${Date.now()}@gmail.com`, password: 'StudentPass123!' });

  const studentToken = studentUserRes.json ? studentUserRes.json.token : null;
  if (!studentToken) {
    console.error('❌ FAIL: Could not authenticate non-admin student user.');
    process.exit(1);
  }
  console.log('✅ Authenticated Non-Admin Student User.');

  // 3️⃣ Fetch existing students
  console.log('\n3️⃣ Fetching registered student records...');
  const getStudentsRes = await makeRequest('/api/students', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  if (getStudentsRes.statusCode !== 200 || !Array.isArray(getStudentsRes.json) || getStudentsRes.json.length === 0) {
    console.error('❌ FAIL: Failed to retrieve student list:', getStudentsRes.statusCode);
    process.exit(1);
  }

  const initialCount = getStudentsRes.json.length;
  const targetStudent = getStudentsRes.json[0];
  console.log(`✅ Retrieved ${initialCount} student records. Target student: "${targetStudent.name}" (ID: ${targetStudent.id}, Roll: ${targetStudent.roll_no})`);

  // 4️⃣ Test Non-Admin permission enforcement (Should fail with 403 Forbidden)
  console.log('\n4️⃣ Testing Non-Admin edit attempt (Permission check)...');
  const unauthorizedUpdateRes = await makeRequest(`/api/students/${targetStudent.id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    }
  }, { name: 'Hacked Name', roll_no: targetStudent.roll_no });

  if (unauthorizedUpdateRes.statusCode === 403) {
    console.log('✅ PASS: Non-Admin edit attempt correctly blocked with 403 Forbidden!');
  } else {
    console.error('❌ FAIL: Non-Admin edit attempt returned status:', unauthorizedUpdateRes.statusCode, unauthorizedUpdateRes.json);
    process.exit(1);
  }

  // 5️⃣ Test Admin editing SAME student record (Should succeed with 200 OK)
  console.log('\n5️⃣ Testing Admin edit of student profile...');
  const updatedBio = `Lead robotics researcher updated at ${new Date().toISOString()}`;
  const updatedPhone = '+91 98765 43210';
  const updatedDept = 'Robotics & Automation';

  const updateRes = await makeRequest(`/api/students/${targetStudent.id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    name: targetStudent.name,
    roll_no: targetStudent.roll_no,
    email: targetStudent.email || 'updated_student@igridlab.edu.in',
    phone: updatedPhone,
    department: updatedDept,
    year: targetStudent.year || '3rd Year',
    section: 'Section A',
    college: 'Indra Ganesan College of Engineering',
    role: targetStudent.role || 'Lead Researcher',
    skills: 'ROS2, Python, FreeRTOS, PCB Layout',
    photo_url: targetStudent.photo_url || '',
    github_url: 'https://github.com/igridlab-code',
    linkedin_url: 'https://linkedin.com/in/igridlab',
    bio: updatedBio,
    assigned_project: 'Smart Grass Cutter Robot',
    status: 'Active'
  });

  if (updateRes.statusCode === 200 && updateRes.json && updateRes.json.student) {
    console.log('✅ PASS: Admin successfully updated student profile!');
    console.log('   - Response message:', updateRes.json.message);
    console.log('   - Updated Bio:', updateRes.json.student.bio);
    console.log('   - Updated Phone:', updateRes.json.student.phone);
    console.log('   - Updated Department:', updateRes.json.student.department);
  } else {
    console.error('❌ FAIL: Admin student edit failed:', updateRes.statusCode, updateRes.json);
    process.exit(1);
  }

  // 6️⃣ Verify persistence and ensure NO duplicate record was created
  console.log('\n6️⃣ Verifying data persistence and no duplicate creation...');
  const verifyRes = await makeRequest('/api/students', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  const finalCount = verifyRes.json ? verifyRes.json.length : 0;
  if (finalCount === initialCount) {
    console.log(`✅ PASS: Student count remained exactly ${initialCount} (No duplicate record created)!`);
  } else {
    console.error(`❌ FAIL: Student count changed from ${initialCount} to ${finalCount}!`);
    process.exit(1);
  }

  const updatedRecord = verifyRes.json.find(s => s.id === targetStudent.id);
  if (updatedRecord && updatedRecord.bio === updatedBio && updatedRecord.phone === updatedPhone) {
    console.log('✅ PASS: Updated student profile is persistent and verified in database!');
  } else {
    console.error('❌ FAIL: Updated fields not matched in database verification:', updatedRecord);
    process.exit(1);
  }

  console.log('\n🎉 ALL ADMIN STUDENT PROFILE MANAGEMENT VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
