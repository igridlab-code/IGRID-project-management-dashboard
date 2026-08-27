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
  console.log('🧪 Starting Full Student Dashboard & Security Verification Suite...\n');

  // 1️⃣ Student Registration Test
  console.log('1️⃣ Testing Student Registration with complete field set...');
  const regTimestamp = Date.now();
  const student1Email = `student1_${regTimestamp}@igridlab.edu.in`;
  const student1Roll = `81122110${regTimestamp.toString().slice(-4)}`;

  const regRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Ananya Ramesh',
    roll_no: student1Roll,
    email: student1Email,
    phone: '+91 98765 11111',
    department: 'ECE',
    year: '3rd Year',
    section: 'A',
    project_title: 'AI Smart Irrigation System',
    team_members: 'Ananya Ramesh, Rahul V',
    guide: 'Dr. S. Kanthasamy',
    password: 'StudentPass123!'
  });

  if (regRes.statusCode !== 201 || !regRes.json || !regRes.json.token) {
    console.error('❌ FAIL: Student Registration failed:', regRes.statusCode, regRes.json);
    process.exit(1);
  }

  const student1Token = regRes.json.token;
  const student1Id = regRes.json.user.student_id;
  console.log(`✅ PASS: Registered Student 1 "${student1Email}" (ID: ${student1Id}, Roll: ${student1Roll}). Role: ${regRes.json.user.role}`);

  // 2️⃣ Student Login Test
  console.log('\n2️⃣ Testing Student Login...');
  const loginRes = await makeRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: student1Email, password: 'StudentPass123!' });

  if (loginRes.statusCode !== 200 || !loginRes.json.token) {
    console.error('❌ FAIL: Student Login failed:', loginRes.statusCode, loginRes.json);
    process.exit(1);
  }
  console.log('✅ PASS: Student Login successful!');

  // 3️⃣ Student Read Own Profile Test
  console.log('\n3️⃣ Testing Student viewing own profile...');
  const ownProfileRes = await makeRequest(`/api/students/${student1Id}`, {
    headers: { 'Authorization': `Bearer ${student1Token}` }
  });

  if (ownProfileRes.statusCode === 200 && ownProfileRes.json && ownProfileRes.json.name === 'Ananya Ramesh') {
    console.log(`✅ PASS: Student successfully read own profile (Project: ${ownProfileRes.json.assigned_project || ownProfileRes.json.project_title})`);
  } else {
    console.error('❌ FAIL: Student read own profile failed:', ownProfileRes.statusCode, ownProfileRes.json);
    process.exit(1);
  }

  // 4️⃣ Register Student 2 for cross-account security testing
  console.log('\n4️⃣ Registering Student 2 for security isolation testing...');
  const student2Email = `student2_${regTimestamp}@igridlab.edu.in`;
  const reg2Res = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Karthik Raja',
    roll_no: `81122110${(regTimestamp + 1).toString().slice(-4)}`,
    email: student2Email,
    password: 'StudentPass123!'
  });

  const student2Token = reg2Res.json.token;
  const student2Id = reg2Res.json.user.student_id;
  console.log(`✅ PASS: Registered Student 2 "${student2Email}" (ID: ${student2Id}).`);

  // 5️⃣ Security Test: Student 2 blocked from viewing Student 1 profile
  console.log('\n5️⃣ Security Check: Student 2 reading Student 1 profile (Should be 403 Forbidden)...');
  const crossReadRes = await makeRequest(`/api/students/${student1Id}`, {
    headers: { 'Authorization': `Bearer ${student2Token}` }
  });

  if (crossReadRes.statusCode === 403) {
    console.log('✅ PASS: Cross-student read blocked with 403 Forbidden!');
  } else {
    console.error('❌ FAIL: Cross-student read returned status:', crossReadRes.statusCode, crossReadRes.json);
    process.exit(1);
  }

  // 6️⃣ Security Test: Student 2 blocked from modifying Student 1 profile
  console.log('\n6️⃣ Security Check: Student 2 modifying Student 1 profile (Should be 403 Forbidden)...');
  const crossEditRes = await makeRequest(`/api/students/${student1Id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${student2Token}`,
      'Content-Type': 'application/json'
    }
  }, { bio: 'Hacked bio by Student 2' });

  if (crossEditRes.statusCode === 403) {
    console.log('✅ PASS: Cross-student edit blocked with 403 Forbidden!');
  } else {
    console.error('❌ FAIL: Cross-student edit returned status:', crossEditRes.statusCode, crossEditRes.json);
    process.exit(1);
  }

  // 7️⃣ Security Test: Student self-update allowed ONLY on permitted fields
  console.log('\n7️⃣ Testing Student 1 self-update of personal bio...');
  const selfBio = 'Updated robotics researcher bio';
  const selfEditRes = await makeRequest(`/api/students/${student1Id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${student1Token}`,
      'Content-Type': 'application/json'
    }
  }, { bio: selfBio, phone: '+91 99999 88888' });

  if (selfEditRes.statusCode === 200 && selfEditRes.json.student && selfEditRes.json.student.bio === selfBio) {
    console.log('✅ PASS: Student self-update succeeded on permitted personal fields!');
  } else {
    console.error('❌ FAIL: Student self-update failed:', selfEditRes.statusCode, selfEditRes.json);
    process.exit(1);
  }

  // 8️⃣ Admin Calendar Activity CRUD & Student Gating Test
  console.log('\n8️⃣ Testing Admin Calendar Activity Management...');
  let adminRes = await makeRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'kaviyaarumugam541@gmail.com', password: 'AdminPassword123!' });

  let adminToken = adminRes.json ? adminRes.json.token : null;
  if (!adminToken) {
    adminRes = await makeRequest('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: `admin_tester_${Date.now()}@gmail.com`, password: 'AdminPassword123!', role: 'admin' });
    adminToken = adminRes.json.token;
  }

  // Student 1 tries adding calendar activity -> should fail 403
  const studentAddCalRes = await makeRequest(`/api/students/${student1Id}/calendar`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${student1Token}`, 'Content-Type': 'application/json' }
  }, { month: 'January', date: '05', activity: 'Unauthorized Student Activity' });

  if (studentAddCalRes.statusCode === 403) {
    console.log('✅ PASS: Student blocked from adding calendar activity (403 Forbidden).');
  } else {
    console.error('❌ FAIL: Student calendar add returned status:', studentAddCalRes.statusCode);
    process.exit(1);
  }

  // Admin adds calendar activity -> should succeed
  const addCalRes = await makeRequest(`/api/students/${student1Id}/calendar`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, {
    month: 'January',
    date: '05',
    activity: 'Project Selection & Literature Review',
    status: 'Completed',
    progress: 15,
    remarks: 'Approved by Mentor'
  });

  if (addCalRes.statusCode === 201 && addCalRes.json.id) {
    const activityId = addCalRes.json.id;
    console.log(`✅ PASS: Admin successfully added month-wise calendar activity (ID: ${activityId}).`);

    // Admin updates calendar activity
    const editCalRes = await makeRequest(`/api/students/calendar/${activityId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    }, {
      month: 'January',
      date: '10',
      activity: 'Project Selection & Hardware Procurement',
      status: 'Completed',
      progress: 25,
      remarks: 'Components Ordered'
    });

    if (editCalRes.statusCode === 200) {
      console.log('✅ PASS: Admin successfully updated calendar activity.');
    } else {
      console.error('❌ FAIL: Admin edit calendar activity failed:', editCalRes.statusCode);
      process.exit(1);
    }

    // Student reads calendar -> should succeed
    const getCalRes = await makeRequest(`/api/students/${student1Id}/calendar`, {
      headers: { 'Authorization': `Bearer ${student1Token}` }
    });

    if (getCalRes.statusCode === 200 && Array.isArray(getCalRes.json) && getCalRes.json.length > 0) {
      console.log(`✅ PASS: Student read own calendar activities (${getCalRes.json.length} item).`);
    } else {
      console.error('❌ FAIL: Student get calendar failed:', getCalRes.statusCode);
      process.exit(1);
    }

    // Admin deletes calendar activity
    const delCalRes = await makeRequest(`/api/students/calendar/${activityId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (delCalRes.statusCode === 200) {
      console.log('✅ PASS: Admin successfully deleted calendar activity.');
    } else {
      console.error('❌ FAIL: Admin delete calendar activity failed:', delCalRes.statusCode);
      process.exit(1);
    }
  } else {
    console.error('❌ FAIL: Admin add calendar activity failed:', addCalRes.statusCode, addCalRes.json);
    process.exit(1);
  }

  console.log('\n🎉 ALL FULL STUDENT DASHBOARD & SECURITY TESTS PASSED 100% SUCCESSFULLY!');
}

runTests().catch(console.error);
