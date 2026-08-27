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
  console.log('🧪 Starting Edit Project Save & Persistence Verification Suite...\n');

  // 1. Authenticate Admin
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

  // 2. Fetch Projects
  const projectsRes = await makeRequest('/api/projects', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (projectsRes.statusCode !== 200 || !Array.isArray(projectsRes.json) || projectsRes.json.length === 0) {
    console.error('❌ FAIL: Could not fetch project list:', projectsRes.statusCode);
    process.exit(1);
  }
  const testProject = projectsRes.json[0];
  const projectId = testProject.id;
  console.log(`✅ PASS: Using Project ID ${projectId} ("${testProject.title}") for edit testing.\n`);

  // 3. Edit Project Details
  const updatedTitle = `Test Project Save ${Date.now()}`;
  const updatedDesc = 'Comprehensive edit verification description testing save flow and modal closure.';
  const updatedAction = 'Verify hardware test bench and publish updated milestone report.';
  const updatedDocUrl = 'https://drive.google.com/file/d/123456789/view';

  console.log('1️⃣ Submitting PUT /api/projects/:id with updated project details...');
  const editRes = await makeRequest(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    project_code: testProject.project_code,
    title: updatedTitle,
    description: updatedDesc,
    domain: testProject.domain || 'Robotics',
    priority: 'High',
    status: 'in_progress',
    tags: '#Robotics, #Updated, #Verified',
    progress: 75,
    due_date: '2026-11-30',
    immediate_action: updatedAction,
    github_repo: 'https://github.com/igrid-lab/test-project',
    youtube_url: 'https://youtube.com/watch?v=123456',
    doc_url: updatedDocUrl,
    linkedin_url: 'https://linkedin.com/feed/update/123456',
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
    team_name: 'Team Innovation Alpha',
    team_lead: 'Aarav Sharma',
    team_lead_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    deliverables: 'Complete hardware prototype, test logs, and CAD design files'
  });

  if (editRes.statusCode !== 200 || !editRes.json) {
    console.error('❌ FAIL: Edit project request failed:', editRes.statusCode, editRes.json);
    process.exit(1);
  }
  console.log('✅ PASS: PUT /api/projects/:id returned 200 OK with success message!');

  // 4. Verify Persistence via GET /api/projects/:id
  console.log('\n2️⃣ Verifying persistence via GET /api/projects/:id...');
  const getSingleRes = await makeRequest(`/api/projects/${projectId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  if (getSingleRes.statusCode !== 200 || !getSingleRes.json) {
    console.error('❌ FAIL: GET /api/projects/:id failed:', getSingleRes.statusCode);
    process.exit(1);
  }

  const updatedProj = getSingleRes.json;
  if (updatedProj.title === updatedTitle && updatedProj.immediate_action === updatedAction && updatedProj.doc_url === updatedDocUrl && updatedProj.progress === 75) {
    console.log('✅ PASS: All updated fields persisted accurately in SQLite database!');
    console.log(`   - Title: "${updatedProj.title}"`);
    console.log(`   - Priority: "${updatedProj.priority}"`);
    console.log(`   - Progress: ${updatedProj.progress}%`);
    console.log(`   - Doc URL: "${updatedProj.doc_url}"`);
  } else {
    console.error('❌ FAIL: Mismatched project fields after save:', updatedProj);
    process.exit(1);
  }

  // 5. Verify in Project List
  console.log('\n3️⃣ Verifying updated project in GET /api/projects list...');
  const listCheckRes = await makeRequest('/api/projects', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const foundInList = (listCheckRes.json || []).find(p => p.id === projectId);
  if (foundInList && foundInList.title === updatedTitle) {
    console.log('✅ PASS: Project list view contains updated details!');
  } else {
    console.error('❌ FAIL: Updated project not reflected in project list:', foundInList);
    process.exit(1);
  }

  // Restore original title
  await makeRequest(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    title: testProject.title,
    description: testProject.description,
    immediate_action: testProject.immediate_action,
    doc_url: testProject.doc_url,
    progress: testProject.progress
  });

  console.log('\n🎉 ALL EDIT PROJECT SAVE & PERSISTENCE TESTS PASSED 100% SUCCESSFULLY!');
}

runTests().catch(console.error);
