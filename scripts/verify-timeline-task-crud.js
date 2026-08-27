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
  console.log('🧪 Starting Project Timeline & Task CRUD Verification Suite...\n');

  // Authenticate Admin User
  const loginRes = await makeRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'kaviyaarumugam541@gmail.com', password: 'AdminPassword123!' });

  let token = loginRes.json ? loginRes.json.token : null;
  if (!token) {
    const signupRes = await makeRequest('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: `admin_timeline_${Date.now()}@igrid.lab`, password: 'AdminPassword123!', role: 'admin' });
    token = signupRes.json.token;
  }

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 1️⃣ Fetch Projects List & Pick Project ID 1
  console.log('1️⃣ Fetching Projects list...');
  const projRes = await makeRequest('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
  if (projRes.statusCode !== 200 || !Array.isArray(projRes.json) || projRes.json.length === 0) {
    console.error('❌ FAIL: Could not fetch projects list:', projRes.statusCode, projRes.json);
    process.exit(1);
  }

  const project = projRes.json[0];
  const projectId = project.id;
  console.log(`✅ PASS: Active Project selected "${project.title}" (ID: ${projectId}, Code: ${project.project_code})`);

  // 2️⃣ Check Initial Task Count
  console.log('\n2️⃣ Fetching initial tasks for project...');
  let tasksRes = await makeRequest(`/api/projects/${projectId}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } });
  const initialCount = Array.isArray(tasksRes.json) ? tasksRes.json.length : 0;
  console.log(`ℹ️ Initial task count: ${initialCount} items.`);

  // 3️⃣ Test 3: Create Task 1
  console.log('\n3️⃣ Test 3: Creating Task 1 (Hardware Prototype Setup)...');
  const task1Res = await makeRequest(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: authHeaders
  }, {
    task_name: 'Hardware Prototype Setup',
    description: 'Initial assembly of chassis and sensors',
    start_date: '2026-02-01',
    end_date: '2026-03-15',
    start_month: 'February',
    end_month: 'March',
    status: 'in_progress',
    priority: 'high',
    assigned_member: 'Aarav Sharma'
  });

  if (task1Res.statusCode !== 201 || !task1Res.json || !task1Res.json.id) {
    console.error('❌ FAIL: Task 1 creation failed:', task1Res.statusCode, task1Res.json);
    process.exit(1);
  }
  const task1Id = task1Res.json.id;
  console.log(`✅ PASS: Task 1 created successfully (ID: ${task1Id}).`);

  // Verify Task 1 listed
  tasksRes = await makeRequest(`/api/projects/${projectId}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } });
  if (tasksRes.json.length !== initialCount + 1) {
    console.error('❌ FAIL: Total Tasks count did not increment to 1 after Task 1 creation.');
    process.exit(1);
  }
  console.log(`✅ PASS: Total Tasks count updated to ${tasksRes.json.length} items.`);

  // 4️⃣ Test 4: Create Task 2
  console.log('\n4️⃣ Test 4: Creating Task 2 (ROS2 Sensor Integration)...');
  const task2Res = await makeRequest(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: authHeaders
  }, {
    task_name: 'ROS2 Sensor Integration',
    description: 'LiDAR and Camera node integration',
    start_date: '2026-03-16',
    end_date: '2026-05-30',
    start_month: 'March',
    end_month: 'May',
    status: 'not_started',
    priority: 'normal',
    assigned_member: 'Priya Sundaram'
  });

  if (task2Res.statusCode !== 201 || !task2Res.json || !task2Res.json.id) {
    console.error('❌ FAIL: Task 2 creation failed:', task2Res.statusCode, task2Res.json);
    process.exit(1);
  }
  const task2Id = task2Res.json.id;
  console.log(`✅ PASS: Task 2 created successfully (ID: ${task2Id}).`);

  tasksRes = await makeRequest(`/api/projects/${projectId}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } });
  if (tasksRes.json.length !== initialCount + 2) {
    console.error('❌ FAIL: Total Tasks count did not increment after Task 2 creation.');
    process.exit(1);
  }
  console.log(`✅ PASS: Total Tasks count updated to ${tasksRes.json.length} items (Both Task 1 & Task 2 exist).`);

  // 5️⃣ Test 5: Edit Task 1
  console.log('\n5️⃣ Test 5: Editing Task 1 (Hardware Prototype Setup -> Hardware & Electronics Setup)...');
  const editTask1Res = await makeRequest(`/api/tasks/${task1Id}`, {
    method: 'PUT',
    headers: authHeaders
  }, {
    task_name: 'Hardware & Electronics Setup',
    description: 'Updated chassis assembly with dual power distribution',
    start_date: '2026-02-01',
    end_date: '2026-04-10',
    start_month: 'February',
    end_month: 'April',
    status: 'completed',
    priority: 'critical',
    assigned_member: 'Aarav Sharma & Team'
  });

  if (editTask1Res.statusCode !== 200) {
    console.error('❌ FAIL: Task 1 edit failed:', editTask1Res.statusCode, editTask1Res.json);
    process.exit(1);
  }
  console.log('✅ PASS: Task 1 updated successfully via PUT API.');

  // Verify updated Task 1 details
  tasksRes = await makeRequest(`/api/projects/${projectId}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } });
  const updatedTask1 = tasksRes.json.find(t => t.id === task1Id);
  if (!updatedTask1 || updatedTask1.task_name !== 'Hardware & Electronics Setup' || updatedTask1.status !== 'completed') {
    console.error('❌ FAIL: Task 1 data did not persist correctly after edit:', updatedTask1);
    process.exit(1);
  }
  console.log(`✅ PASS: Task 1 data verified in DB (Name: "${updatedTask1.task_name}", Status: "${updatedTask1.status}").`);

  // 6️⃣ Test 6: Delete Task 2
  console.log('\n6️⃣ Test 6: Deleting Task 2...');
  const deleteTask2Res = await makeRequest(`/api/tasks/${task2Id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (deleteTask2Res.statusCode !== 200) {
    console.error('❌ FAIL: Task 2 deletion failed:', deleteTask2Res.statusCode, deleteTask2Res.json);
    process.exit(1);
  }
  console.log('✅ PASS: Task 2 deleted successfully via DELETE API.');

  tasksRes = await makeRequest(`/api/projects/${projectId}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } });
  if (tasksRes.json.some(t => t.id === task2Id)) {
    console.error('❌ FAIL: Task 2 still exists in DB after deletion.');
    process.exit(1);
  }
  console.log(`✅ PASS: Total Tasks count decreased back to ${tasksRes.json.length} items after Task 2 removal.`);

  // 7️⃣ Test 7: Persistence Verification across fresh request
  console.log('\n7️⃣ Test 7: Data Persistence Verification across fresh query...');
  const freshTasksRes = await makeRequest(`/api/projects/${projectId}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } });
  const persistedTask1 = freshTasksRes.json.find(t => t.id === task1Id);
  if (!persistedTask1) {
    console.error('❌ FAIL: Saved Task 1 not found in fresh database query.');
    process.exit(1);
  }
  console.log(`✅ PASS: Task 1 persists cleanly across DB queries (ID: ${persistedTask1.id}, Name: "${persistedTask1.task_name}").`);

  // Clean up test task
  await makeRequest(`/api/tasks/${task1Id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });

  console.log('\n🎉 ALL 8 TIMELINE & TASK CRUD VERIFICATION TESTS PASSED 100% SUCCESSFULLY!');
}

runTests().catch(console.error);
