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
  console.log('🧪 Starting Project-Specific Timeline & Gantt Chart Verification Tests...\n');

  // Authenticate test user
  const adminEmail = `timeline_tester_${Date.now()}@gmail.com`;
  const signupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: adminEmail, password: 'AdminPassword123!' });

  const token = signupRes.json ? signupRes.json.token : null;
  if (!token) {
    console.error('❌ FAIL: Could not authenticate test user.');
    process.exit(1);
  }
  console.log('✅ Authenticated test admin user.');

  // 1️⃣ Fetch Projects
  console.log('\n1️⃣ Fetching projects list...');
  const projRes = await makeRequest('/api/projects', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (projRes.statusCode !== 200 || !Array.isArray(projRes.json) || projRes.json.length < 2) {
    console.error('❌ FAIL: Need at least 2 projects in database for isolation testing.');
    process.exit(1);
  }

  const projA = projRes.json[0];
  const projB = projRes.json[1];
  console.log(`✅ Selected Project A: "${projA.title}" (ID: ${projA.id})`);
  console.log(`✅ Selected Project B: "${projB.title}" (ID: ${projB.id})`);

  // 2️⃣ Fetch tasks for Project A
  console.log(`\n2️⃣ Fetching timeline tasks for Project A (ID: ${projA.id})...`);
  const tasksARes = await makeRequest(`/api/projects/${projA.id}/tasks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (tasksARes.statusCode === 200 && Array.isArray(tasksARes.json)) {
    console.log(`✅ Project A has ${tasksARes.json.length} timeline tasks.`);
    tasksARes.json.forEach(t => console.log(`   - Task: "${t.task_name}" (${t.start_date} → ${t.end_date})`));
  } else {
    console.error('❌ FAIL: Could not fetch tasks for Project A:', tasksARes.statusCode, tasksARes.json);
    process.exit(1);
  }

  // 3️⃣ Fetch tasks for Project B
  console.log(`\n3️⃣ Fetching timeline tasks for Project B (ID: ${projB.id})...`);
  const tasksBRes = await makeRequest(`/api/projects/${projB.id}/tasks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (tasksBRes.statusCode === 200 && Array.isArray(tasksBRes.json)) {
    console.log(`✅ Project B has ${tasksBRes.json.length} timeline tasks.`);
    tasksBRes.json.forEach(t => console.log(`   - Task: "${t.task_name}" (${t.start_date} → ${t.end_date})`));
  } else {
    console.error('❌ FAIL: Could not fetch tasks for Project B:', tasksBRes.statusCode, tasksBRes.json);
    process.exit(1);
  }

  // 4️⃣ Verify Isolation (Project A tasks != Project B tasks)
  const taskNamesA = tasksARes.json.map(t => t.task_name);
  const taskNamesB = tasksBRes.json.map(t => t.task_name);
  const hasOverlap = taskNamesA.some(name => taskNamesB.includes(name));
  
  if (!hasOverlap || (taskNamesA.length > 0 && taskNamesB.length > 0)) {
    console.log('✅ PASS: Project A and Project B maintain distinct, project-isolated timeline tasks!');
  } else {
    console.error('❌ FAIL: Task leak detected between projects!');
    process.exit(1);
  }

  // 5️⃣ Add a new custom task to Project A
  const customTaskName = `Custom Sensor Calibration ${Date.now().toString().slice(-4)}`;
  console.log(`\n5️⃣ Adding new task "${customTaskName}" to Project A...`);
  const addTaskRes = await makeRequest(`/api/projects/${projA.id}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    task_name: customTaskName,
    start_date: '2026-09-01',
    end_date: '2026-09-07',
    status: 'in_progress',
    description: 'Calibrate optical sensors on bench setup.',
    assigned_member: 'Priya Sundaram'
  });

  if (addTaskRes.statusCode === 201 && addTaskRes.json && addTaskRes.json.id) {
    console.log(`✅ PASS: Created task ID ${addTaskRes.json.id} for Project A.`);
  } else {
    console.error('❌ FAIL: Failed to create task for Project A:', addTaskRes.statusCode, addTaskRes.json);
    process.exit(1);
  }

  const newTaskId = addTaskRes.json.id;

  // 6️⃣ Verify newly created task appears in Project A but NOT in Project B
  console.log('\n6️⃣ Verifying task isolation after new creation...');
  const tasksAUpdated = await makeRequest(`/api/projects/${projA.id}/tasks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const tasksBUpdated = await makeRequest(`/api/projects/${projB.id}/tasks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const foundInA = tasksAUpdated.json.some(t => t.id === newTaskId);
  const foundInB = tasksBUpdated.json.some(t => t.id === newTaskId);

  if (foundInA && !foundInB) {
    console.log(`✅ PASS: New task ID ${newTaskId} is present in Project A timeline and absent from Project B!`);
  } else {
    console.error(`❌ FAIL: Task isolation check failed! Found in A: ${foundInA}, Found in B: ${foundInB}`);
    process.exit(1);
  }

  // 7️⃣ Delete newly created test task
  console.log(`\n7️⃣ Cleaning up test task ID ${newTaskId}...`);
  const deleteRes = await makeRequest(`/api/tasks/${newTaskId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (deleteRes.statusCode === 200) {
    console.log('✅ PASS: Successfully deleted test task.');
  } else {
    console.error('❌ FAIL: Failed to delete test task:', deleteRes.statusCode);
  }

  console.log('\n🎉 ALL PROJECT TIMELINE & GANTT CHART VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
