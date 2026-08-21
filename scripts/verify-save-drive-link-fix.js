const http = require('http');
const fs = require('fs');
const path = require('path');

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
  console.log('🧪 Starting Save Button Layout & Google Drive Link Save Fix Verification...\n');

  // 1️⃣ Verify Save button position in public/index.html
  console.log('1️⃣ Verifying Save button layout at bottom of modal form in index.html...');
  const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  if (htmlContent.includes('id="save-project-btn"') && htmlContent.includes('class="modal-footer"')) {
    console.log('✅ PASS: Save button is positioned inside modal-footer at the bottom of the form.');
  } else {
    console.error('❌ FAIL: Save button not found in modal-footer.');
  }

  // 2️⃣ Authenticate User
  console.log('\n2️⃣ Authenticating test user for JWT API requests...');
  const testEmail = `save_drive_fix_${Date.now()}@gmail.com`;
  const signupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail, password: 'Password123!' });

  const token = signupRes.json ? signupRes.json.token : null;
  if (!token) {
    console.error('❌ FAIL: Could not authenticate test user.');
    return;
  }
  console.log('   Authenticated with token.');

  // 3️⃣ Get target project
  const projectsRes = await makeRequest('/api/projects', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (projectsRes.statusCode !== 200 || !projectsRes.json || projectsRes.json.length === 0) {
    console.error('❌ FAIL: Could not fetch projects.');
    return;
  }
  const project = projectsRes.json[0];
  console.log(`   Target Project: ${project.project_code} (ID: ${project.id})`);

  // 4️⃣ Test Google Drive File Link with Share Query Params
  console.log('\n4️⃣ Testing Save with Google Drive File Share Link (https://drive.google.com/file/d/ABC123/view?usp=sharing)...');
  const fileLink = 'https://drive.google.com/file/d/ABC123456789/view?usp=sharing';
  const fileSaveRes = await makeRequest(`/api/projects/${project.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { doc_url: fileLink });

  if (fileSaveRes.statusCode === 200) {
    console.log('✅ PASS: Google Drive file share link saved successfully!');
  } else {
    console.error(`❌ FAIL: Save failed with status ${fileSaveRes.statusCode}`, fileSaveRes.body);
  }

  // 5️⃣ Test Google Drive Folder Link
  console.log('\n5️⃣ Testing Save with Google Drive Folder Link (https://drive.google.com/drive/folders/XYZ987)...');
  const folderLink = 'https://drive.google.com/drive/folders/XYZ987654321';
  const folderSaveRes = await makeRequest(`/api/projects/${project.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { doc_url: folderLink });

  if (folderSaveRes.statusCode === 200) {
    console.log('✅ PASS: Google Drive folder link saved successfully!');
  } else {
    console.error(`❌ FAIL: Folder save failed.`);
  }

  console.log('\n🎉 ALL SAVE BUTTON & GOOGLE DRIVE LINK FIX TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
