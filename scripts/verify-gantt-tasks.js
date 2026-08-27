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
  console.log('🧪 Starting Project Timeline & Gantt Tasks Verification Suite...\n');

  // 1. Authenticate Admin User
  let loginRes = await makeRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'kaviyaarumugam541@gmail.com', password: 'AdminPassword123!' });

  let adminToken = loginRes.json ? loginRes.json.token : null;
  if (!adminToken) {
    loginRes = await makeRequest('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: `admin_tester_${Date.now()}@gmail.com`, password: 'AdminPassword123!', role: 'admin' });
    adminToken = loginRes.json ? loginRes.json.token : null;
  }

  if (!adminToken) {
    console.error('❌ FAIL: Admin authentication failed:', loginRes.statusCode, loginRes.json);
    process.exit(1);
  }
  console.log('✅ PASS: Admin authenticated successfully!');

  // 2. Fetch first available project
  const projectsRes = await makeRequest('/api/projects', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (projectsRes.statusCode !== 200 || !Array.isArray(projectsRes.json) || projectsRes.json.length === 0) {
    console.error('❌ FAIL: Could not fetch project list:', projectsRes.statusCode);
    process.exit(1);
  }
  const testProject = projectsRes.json[0];
  const projectId = testProject.id;
  console.log(`✅ PASS: Using Project ID ${projectId} ("${testProject.title}") for timeline testing.\n`);

  // 3. Test 1 & 2: Verify Initial Task List
  console.log('1️⃣ Fetching initial tasks for project...');
  const initTasksRes = await makeRequest(`/api/projects/${projectId}/tasks`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const initialTaskCount = (initTasksRes.json || []).length;
  console.log(`✅ PASS: Initial task count for Project ${projectId}: ${initialTaskCount} items.`);

  // 4. Test 3: Create Task 1
  console.log('\n2️⃣ Test 3: Creating Task 1 ("Hardware Calibration")...');
  const task1Res = await makeRequest(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    task_name: 'Hardware Calibration & Motor Test',
    start_date: '2026-02-01',
    end_date: '2026-03-15',
    status: 'in_progress',
    priority: 'High',
    description: 'Calibrate stepper motors and test sensors',
    assigned_member: 'Aarav Sharma'
  });

  if (task1Res.statusCode !== 201 || !task1Res.json || !task1Res.json.id) {
    console.error('❌ FAIL: Create Task 1 failed:', task1Res.statusCode, task1Res.json);
    process.exit(1);
  }
  const task1Id = task1Res.json.id;
  console.log(`✅ PASS: Task 1 created successfully with ID ${task1Id}!`);

  // 5. Test 4: Create Task 2
  console.log('\n3️⃣ Test 4: Creating Task 2 ("Software Control Loop")...');
  const task2Res = await makeRequest(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    task_name: 'Software Control Loop Development',
    start_date: '2026-04-01',
    end_date: '2026-05-30',
    status: 'in_progress',
    priority: 'Critical',
    description: 'Implement PID control loop and telemetry API',
    assigned_member: 'Ananya Ramesh'
  });

  if (task2Res.statusCode !== 201 || !task2Res.json || !task2Res.json.id) {
    console.error('❌ FAIL: Create Task 2 failed:', task2Res.statusCode, task2Res.json);
    process.exit(1);
  }
  const task2Id = task2Res.json.id;
  console.log(`✅ PASS: Task 2 created successfully with ID ${task2Id}!`);

  // Verify task count is now initialTaskCount + 2
  const afterAddRes = await makeRequest(`/api/projects/${projectId}/tasks`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (afterAddRes.json.length !== initialTaskCount + 2) {
    console.error(`❌ FAIL: Expected task count ${initialTaskCount + 2}, got ${afterAddRes.json.length}`);
    process.exit(1);
  }
  console.log(`✅ PASS: Total Tasks count updated to ${afterAddRes.json.length} items! दोन्ही tasks present in list.`);

  // 6. Test 5: Edit Task 1
  console.log('\n4️⃣ Test 5: Editing Task 1 (Updating priority and status to Completed)...');
  const editTask1Res = await makeRequest(`/api/tasks/${task1Id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    task_name: 'Hardware Calibration & Motor Test (Finalized)',
    start_date: '2026-02-01',
    end_date: '2026-03-20',
    status: 'completed',
    priority: 'Critical',
    description: 'Updated calibration complete',
    assigned_member: 'Aarav Sharma'
  });

  if (editTask1Res.statusCode !== 200) {
    console.error('❌ FAIL: Edit Task 1 failed:', editTask1Res.statusCode, editTask1Res.json);
    process.exit(1);
  }
  console.log('✅ PASS: Task 1 updated successfully!');

  // 7. Test 6: Delete Task 2
  console.log('\n5️⃣ Test 6: Deleting Task 2...');
  const delTask2Res = await makeRequest(`/api/tasks/${task2Id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  if (delTask2Res.statusCode !== 200) {
    console.error('❌ FAIL: Delete Task 2 failed:', delTask2Res.statusCode, delTask2Res.json);
    process.exit(1);
  }
  console.log('✅ PASS: Task 2 deleted successfully!');

  // Verify task count decreased by 1
  const afterDelRes = await makeRequest(`/api/projects/${projectId}/tasks`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (afterDelRes.json.length !== initialTaskCount + 1) {
    console.error(`❌ FAIL: Expected task count ${initialTaskCount + 1}, got ${afterDelRes.json.length}`);
    process.exit(1);
  }
  console.log(`✅ PASS: Total Tasks count decreased to ${afterDelRes.json.length} items. Task 2 successfully removed.`);

  // 8. Test 7: Data Persistence Check
  console.log('\n6️⃣ Test 7: Verifying Data Persistence...');
  const task1Check = afterDelRes.json.find(t => String(t.id) === String(task1Id));
  if (task1Check && task1Check.status === 'completed' && task1Check.priority === 'Critical') {
    console.log('✅ PASS: Task 1 changes persistent in SQLite database!');
  } else {
    console.error('❌ FAIL: Task 1 persistence check failed:', task1Check);
    process.exit(1);
  }

  // Cleanup test task 1
  await makeRequest(`/api/tasks/${task1Id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  console.log('\n🎉 ALL PROJECT TIMELINE & GANTT TASKS TESTS PASSED 100% SUCCESSFULLY!');
}

runTests().catch(console.error);
