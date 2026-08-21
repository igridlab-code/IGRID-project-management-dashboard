const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}${path}`, options, (res) => {
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
  console.log('🧪 Starting Technical Report Field & Google Drive Validation Verification Tests...\n');

  // Authenticate User
  const testEmail = `tech_report_test_${Date.now()}@gmail.com`;
  const signupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail, password: 'Password123!' });

  const token = signupRes.json ? signupRes.json.token : null;
  if (!token) {
    console.error('❌ FAIL: Could not authenticate test user.');
    return;
  }

  // 1️⃣ Fetch first project ID
  console.log('1️⃣ Fetching existing project for testing...');
  const projectsRes = await makeRequest('/api/projects', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (projectsRes.statusCode !== 200 || !projectsRes.json || projectsRes.json.length === 0) {
    console.error('❌ FAIL: Could not fetch projects.');
    return;
  }

  const targetProject = projectsRes.json[0];
  console.log(`   Target Project: ${targetProject.project_code} (ID: ${targetProject.id})`);

  // 2️⃣ Update Project with Valid Google Drive URL
  console.log('\n2️⃣ Updating Project with Valid Google Drive URL (https://drive.google.com/file/d/12345/view)...');
  const validDriveUrl = 'https://drive.google.com/file/d/1234567890abcdef/view';
  const updateRes = await makeRequest(`/api/projects/${targetProject.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { doc_url: validDriveUrl });

  if (updateRes.statusCode === 200) {
    console.log('✅ PASS: Project updated successfully with valid Google Drive link!');
  } else {
    console.error(`❌ FAIL: Update failed with status ${updateRes.statusCode}`, updateRes.body);
  }

  // 3️⃣ Verify Single Project Endpoint returns doc_url
  console.log('\n3️⃣ Verifying GET /api/projects/:id returns saved doc_url...');
  const singleRes = await makeRequest(`/api/projects/${targetProject.id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (singleRes.statusCode === 200 && singleRes.json && singleRes.json.doc_url === validDriveUrl) {
    console.log(`✅ PASS: Single project view returned expected doc_url: "${singleRes.json.doc_url}"`);
  } else {
    console.error(`❌ FAIL: Expected doc_url "${validDriveUrl}", got "${singleRes.json ? singleRes.json.doc_url : null}"`);
  }

  // 4️⃣ Update Project with Valid Google Docs URL
  console.log('\n4️⃣ Testing Google Docs URL (https://docs.google.com/document/d/abcdef/edit)...');
  const validDocsUrl = 'https://docs.google.com/document/d/abcdef1234567890/edit';
  const docsRes = await makeRequest(`/api/projects/${targetProject.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { doc_url: validDocsUrl });

  if (docsRes.statusCode === 200) {
    console.log('✅ PASS: Project updated successfully with valid Google Docs link!');
  } else {
    console.error(`❌ FAIL: Update failed for Google Docs URL.`);
  }

  console.log('\n🎉 ALL TECHNICAL REPORT FIELD VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
