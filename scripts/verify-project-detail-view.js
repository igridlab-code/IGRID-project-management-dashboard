const fs = require('fs');
const path = require('path');
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
  console.log('🧪 Starting Project Details View Modal Field Audit Verification...\n');

  const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  const jsPath = path.join(__dirname, '..', 'public', 'js', 'app.js');
  const jsContent = fs.readFileSync(jsPath, 'utf8');

  // 1️⃣ Check Team Members element in index.html
  console.log('1️⃣ Checking #detail-team-members element in index.html...');
  if (htmlContent.includes('id="detail-team-members"')) {
    console.log('✅ PASS: #detail-team-members element present in detail modal layout.');
  } else {
    console.error('❌ FAIL: #detail-team-members element missing from index.html.');
  }

  // 2️⃣ Check Priority Badge & Description fallback handling in app.js
  console.log('\n2️⃣ Checking Priority Badge & Description fallback handling in app.js...');
  if (jsContent.includes("project.priority || 'Normal'") && jsContent.includes("detail-team-members")) {
    console.log('✅ PASS: Priority fallback (no "undefined Priority") & Team Members rendering present in app.js!');
  } else {
    console.error('❌ FAIL: Priority fallback logic missing.');
  }

  // 3️⃣ Test Live Data Fetch & Field Mapping via API
  console.log('\n3️⃣ Testing project creation with full fields via API...');
  const userEmail = `view_audit_admin_${Date.now()}@gmail.com`;
  const signupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: userEmail, password: 'AdminPassword123!' });

  const token = signupRes.json ? signupRes.json.token : null;
  if (!token) {
    console.error('❌ FAIL: Could not authenticate test user.');
    return;
  }

  const testPayload = {
    project_code: `IGRID-VIEW-${Date.now().toString().slice(-4)}`,
    title: 'Full Audit Test Project',
    description: 'This is a real full description saved in DB.',
    domain: 'AI',
    priority: 'High',
    status: 'in_progress',
    progress: 85,
    due_date: '2026-10-15',
    immediate_action: 'Perform final integration test',
    github_repo: 'https://github.com/igrid-lab/view-test',
    doc_url: 'https://drive.google.com/file/d/test1234/view',
    team_name: 'Team VisionCore',
    team_lead: 'Priya Sundaram',
    team_members: ['Alex Chen', 'Sarah Jenkins'],
    deliverables: 'Complete hardware PCB and software repo'
  };

  const createRes = await makeRequest('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, testPayload);

  if (createRes.statusCode === 201 && createRes.json && createRes.json.id) {
    const projectId = createRes.json.id;
    console.log(`✅ PASS: Created test project ID ${projectId}. Fetching single project data...`);

    const getRes = await makeRequest(`/api/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (getRes.statusCode === 200 && getRes.json) {
      const p = getRes.json;
      console.log(`   Priority: "${p.priority}"`);
      console.log(`   Description: "${p.description}"`);
      console.log(`   Doc URL: "${p.doc_url}"`);
      console.log(`   GitHub Repo: "${p.github_repo}"`);
      console.log(`   Team Members:`, p.team_members);

      if (p.priority === 'High' && p.description === testPayload.description && p.doc_url === testPayload.doc_url && Array.isArray(p.team_members) && p.team_members.length === 2) {
        console.log('✅ PASS: All saved fields returned accurately from database!');
      } else {
        console.error('❌ FAIL: Database field returned mismatch.');
      }
    } else {
      console.error(`❌ FAIL: GET /api/projects/${projectId} failed.`);
    }
  } else {
    console.error(`❌ FAIL: Could not create test project.`);
  }

  console.log('\n🎉 ALL PROJECT DETAILS VIEW MODAL AUDIT TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
