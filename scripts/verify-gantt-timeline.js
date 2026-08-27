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
  console.log('🧪 Starting Project Management Timeline & Gantt Chart Verification Suite...\n');

  // 1. Authenticate Admin User
  console.log('1️⃣ Authenticating test user...');
  let authRes = await makeRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'kaviyaarumugam541@gmail.com', password: 'AdminPassword123!' });

  let token = authRes.json ? authRes.json.token : null;
  if (!token) {
    authRes = await makeRequest('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: `admin_timeline_${Date.now()}@igridlab.edu.in`, password: 'AdminPassword123!', role: 'admin', name: 'Lab Admin' });
    token = authRes.json ? authRes.json.token : null;
  }

  if (!token) {
    console.error('❌ FAIL: Authentication failed:', authRes.statusCode, authRes.json);
    process.exit(1);
  }
  console.log('✅ PASS: Authenticated successfully!');

  // 2. Fetch Projects to target a valid project ID
  console.log('\n2️⃣ Fetching existing projects...');
  const projRes = await makeRequest('/api/projects', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (projRes.statusCode !== 200 || !Array.isArray(projRes.json) || projRes.json.length === 0) {
    console.error('❌ FAIL: No projects found to attach tasks to.');
    process.exit(1);
  }

  const targetProject = projRes.json[0];
  const projectId = targetProject.id;
  console.log(`✅ PASS: Target Project found: "${targetProject.title}" (ID: ${projectId}, Code: ${targetProject.project_code})`);

  // 3. Test Form Validation (Missing Task Name)
  console.log('\n3️⃣ Testing Task Form Validation (Missing Task Name)...');
  const invalidRes1 = await makeRequest(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  }, { start_date: '2026-03-01', end_date: '2026-03-15' });

  if (invalidRes1.statusCode === 400) {
    console.log('✅ PASS: Missing task name correctly rejected with 400 Bad Request!');
  } else {
    console.error('❌ FAIL: Missing task name returned status:', invalidRes1.statusCode, invalidRes1.json);
    process.exit(1);
  }

  // 4. Test Form Validation (End Date earlier than Start Date)
  console.log('\n4️⃣ Testing Task Form Validation (End Date < Start Date)...');
  const invalidRes2 = await makeRequest(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  }, {
    task_name: 'Invalid Date Task',
    start_date: '2026-04-20',
    end_date: '2026-04-01'
  });

  if (invalidRes2.statusCode === 400 && invalidRes2.json.error.includes('earlier than Start Date')) {
    console.log('✅ PASS: Invalid date range correctly rejected with 400 Bad Request!');
  } else {
    console.error('❌ FAIL: Invalid date range returned status:', invalidRes2.statusCode, invalidRes2.json);
    process.exit(1);
  }

  // 5. Test Creating Valid Timeline Task
  console.log('\n5️⃣ Testing Create Project Task (POST /api/projects/:id/tasks)...');
  const taskName = `Motor Calibration & ROS2 Integration ${Date.now()}`;
  const createRes = await makeRequest(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  }, {
    task_name: taskName,
    start_date: '2026-02-01',
    end_date: '2026-05-15',
    status: 'in_progress',
    priority: 'High',
    progress: 45,
    assigned_member: 'Aarav Sharma',
    description: 'Hardware assembly, motor PWM tuning, and ROS2 node integration.'
  });

  if (createRes.statusCode !== 201 || !createRes.json || !createRes.json.id) {
    console.error('❌ FAIL: Task creation failed:', createRes.statusCode, createRes.json);
    process.exit(1);
  }

  const taskId = createRes.json.id;
  console.log(`✅ PASS: Task created successfully! Task ID: ${taskId}`);

  // 6. Test Reading Tasks (Project level & Global level)
  console.log('\n6️⃣ Testing Read Tasks (GET /api/projects/:id/tasks & GET /api/tasks)...');
  const readProjectTasksRes = await makeRequest(`/api/projects/${projectId}/tasks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const readAllTasksRes = await makeRequest('/api/tasks', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (readProjectTasksRes.statusCode === 200 && readAllTasksRes.statusCode === 200) {
    const foundTask = readProjectTasksRes.json.find(t => t.id === taskId);
    if (foundTask && foundTask.task_name === taskName && foundTask.progress === 45 && foundTask.priority === 'High') {
      console.log(`✅ PASS: Created task successfully retrieved from database (Progress: ${foundTask.progress}%, Priority: ${foundTask.priority})`);
    } else {
      console.error('❌ FAIL: Task not found in project tasks list:', readProjectTasksRes.json);
      process.exit(1);
    }
  } else {
    console.error('❌ FAIL: Failed to read tasks:', readProjectTasksRes.statusCode, readAllTasksRes.statusCode);
    process.exit(1);
  }

  // 7. Test Updating Timeline Task (PUT /api/tasks/:taskId)
  console.log('\n7️⃣ Testing Update Task (PUT /api/tasks/:taskId)...');
  const updatedTaskName = `${taskName} - COMPLETED`;
  const updateRes = await makeRequest(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  }, {
    task_name: updatedTaskName,
    start_date: '2026-02-01',
    end_date: '2026-06-30',
    status: 'completed',
    priority: 'High',
    progress: 100,
    assigned_member: 'Aarav Sharma & Team',
    description: 'All motor PWM tuning and ROS2 node testing completed.'
  });

  if (updateRes.statusCode === 200) {
    console.log('✅ PASS: Task updated successfully!');
  } else {
    console.error('❌ FAIL: Task update failed:', updateRes.statusCode, updateRes.json);
    process.exit(1);
  }

  // Verify updated fields in DB
  const verifyUpdateRes = await makeRequest(`/api/projects/${projectId}/tasks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const updatedTask = verifyUpdateRes.json.find(t => t.id === taskId);
  if (updatedTask && updatedTask.task_name === updatedTaskName && updatedTask.progress === 100 && updatedTask.status === 'completed') {
    console.log('✅ PASS: Database verified updated task fields (100% progress, Completed)!');
  } else {
    console.error('❌ FAIL: Updated task verification failed:', updatedTask);
    process.exit(1);
  }

  // 8. Test Deleting Task (DELETE /api/tasks/:taskId)
  console.log('\n8️⃣ Testing Delete Task (DELETE /api/tasks/:taskId)...');
  const deleteRes = await makeRequest(`/api/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (deleteRes.statusCode === 200) {
    console.log('✅ PASS: Task deleted successfully!');
  } else {
    console.error('❌ FAIL: Task delete failed:', deleteRes.statusCode, deleteRes.json);
    process.exit(1);
  }

  // Verify deletion from DB
  const verifyDelRes = await makeRequest(`/api/projects/${projectId}/tasks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const deletedTask = verifyDelRes.json.find(t => t.id === taskId);
  if (!deletedTask) {
    console.log('✅ PASS: Task completely removed from database!');
  } else {
    console.error('❌ FAIL: Deleted task still exists in DB:', deletedTask);
    process.exit(1);
  }

  console.log('\n🎉 ALL PROJECT TIMELINE & GANTT CHART VERIFICATION TESTS PASSED 100% SUCCESSFULLY!');
}

runTests().catch(console.error);
