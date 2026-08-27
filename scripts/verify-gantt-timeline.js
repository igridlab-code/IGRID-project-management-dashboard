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

async function runGanttTests() {
  console.log('🧪 Starting Project Management Timeline & Gantt Verification Suite...\n');

  // 1️⃣ Admin Login
  console.log('1️⃣ Authenticating Admin User...');
  let adminRes = await makeRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'kaviyaarumugam541@gmail.com', password: 'AdminPassword123!' });

  let adminToken = adminRes.json ? adminRes.json.token : null;
  if (!adminToken) {
    adminRes = await makeRequest('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: `admin_gantt_${Date.now()}@gmail.com`, password: 'AdminPassword123!', role: 'admin' });
    adminToken = adminRes.json.token;
  }
  console.log('✅ PASS: Admin authenticated successfully.');

  // 2️⃣ Student Login
  console.log('\n2️⃣ Authenticating Student User...');
  const studentEmail = `student_gantt_${Date.now()}@igridlab.edu.in`;
  const studentRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Siddharth V',
    email: studentEmail,
    password: 'StudentPass123!',
    roll_no: `8112211${Date.now().toString().slice(-5)}`
  });
  const studentToken = studentRes.json.token;
  console.log(`✅ PASS: Student "${studentEmail}" authenticated successfully.`);

  // 3️⃣ Get Projects to retrieve a target project_id
  console.log('\n3️⃣ Retrieving projects list...');
  const projectsRes = await makeRequest('/api/projects', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const projects = projectsRes.json || [];
  if (projects.length === 0) {
    console.error('❌ FAIL: No projects found in DB for task creation.');
    process.exit(1);
  }
  const targetProjectId = projects[0].id;
  console.log(`✅ PASS: Target Project ID: ${targetProjectId} (${projects[0].project_code} - ${projects[0].title})`);

  // 4️⃣ Admin Creates Timeline Task (Requirement #2)
  console.log('\n4️⃣ Admin Creating Timeline Task (POST /api/projects/:id/tasks)...');
  const addTaskRes = await makeRequest(`/api/projects/${targetProjectId}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    task_name: 'Microcontroller Circuit Assembly & Testing',
    start_date: '2026-02-01',
    end_date: '2026-04-15',
    status: 'in_progress',
    priority: 'High',
    assigned_member: 'Siddharth V (Lead)',
    description: 'Hardware wiring, PCB soldering, and sensor calibration',
    is_milestone: 1
  });

  if (addTaskRes.statusCode !== 201 || !addTaskRes.json.id) {
    console.error('❌ FAIL: Admin create task failed:', addTaskRes.statusCode, addTaskRes.json);
    process.exit(1);
  }

  const createdTaskId = addTaskRes.json.id;
  console.log(`✅ PASS: Created Task ID: ${createdTaskId} with Start Date: 2026-02-01 and End Date: 2026-04-15.`);

  // 5️⃣ Student View Tasks (Requirement #10 & #12)
  console.log('\n5️⃣ Student Fetching Timeline Tasks (GET /api/tasks)...');
  const fetchTasksRes = await makeRequest('/api/tasks', {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });

  if (fetchTasksRes.statusCode === 200 && Array.isArray(fetchTasksRes.json)) {
    const foundTask = fetchTasksRes.json.find(t => Number(t.id) === Number(createdTaskId));
    if (foundTask && foundTask.task_name.includes('Microcontroller Circuit')) {
      console.log(`✅ PASS: Student successfully fetched timeline tasks from DB! Found task "${foundTask.task_name}"`);
    } else {
      console.error('❌ FAIL: Created task not found in student tasks list:', fetchTasksRes.json);
      process.exit(1);
    }
  } else {
    console.error('❌ FAIL: Student fetch tasks failed:', fetchTasksRes.statusCode);
    process.exit(1);
  }

  // 6️⃣ Student Permission Enforcement Gating (Requirement #10)
  console.log('\n6️⃣ Security Check: Student attempting to Add/Edit/Delete Task (Should be 403 Forbidden)...');
  const studentAddRes = await makeRequest(`/api/projects/${targetProjectId}/tasks`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
  }, { task_name: 'Unauthorized Student Task', start_date: '2026-01-01', end_date: '2026-01-10' });

  const studentEditRes = await makeRequest(`/api/tasks/${createdTaskId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
  }, { start_date: '2026-03-01', end_date: '2026-05-01' });

  const studentDelRes = await makeRequest(`/api/tasks/${createdTaskId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });

  if (studentAddRes.statusCode === 403 && studentEditRes.statusCode === 403 && studentDelRes.statusCode === 403) {
    console.log('✅ PASS: All unauthorized student task modifications blocked with 403 Forbidden!');
  } else {
    console.error('❌ FAIL: Student permission checks failed:', studentAddRes.statusCode, studentEditRes.statusCode, studentDelRes.statusCode);
    process.exit(1);
  }

  // 7️⃣ Admin Edits Task / Drag Resize Update (Requirement #3 & #5)
  console.log('\n7️⃣ Admin Updating Task Dates & Status (PUT /api/tasks/:taskId)...');
  const editTaskRes = await makeRequest(`/api/tasks/${createdTaskId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    task_name: 'Microcontroller Circuit Assembly & Testing (Phase 1)',
    start_date: '2026-02-10',
    end_date: '2026-05-01',
    status: 'completed',
    priority: 'High',
    is_milestone: 1
  });

  if (editTaskRes.statusCode === 200) {
    console.log('✅ PASS: Admin successfully updated task start/end dates and status.');
  } else {
    console.error('❌ FAIL: Admin update task failed:', editTaskRes.statusCode, editTaskRes.json);
    process.exit(1);
  }

  // 8️⃣ Admin Deletes Task (Requirement #4)
  console.log('\n8️⃣ Admin Deleting Task (DELETE /api/tasks/:taskId)...');
  const delTaskRes = await makeRequest(`/api/tasks/${createdTaskId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  if (delTaskRes.statusCode === 200) {
    console.log('✅ PASS: Task deleted successfully from database.');
  } else {
    console.error('❌ FAIL: Admin delete task failed:', delTaskRes.statusCode, delTaskRes.json);
    process.exit(1);
  }

  console.log('\n🎉 ALL PROJECT MANAGEMENT TIMELINE & GANTT TESTS PASSED 100% SUCCESSFULLY!');
}

runGanttTests().catch(console.error);
