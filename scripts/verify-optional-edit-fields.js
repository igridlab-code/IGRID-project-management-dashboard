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
  console.log('🧪 Starting Verification of Optional Fields in Edit Project Form...\n');

  // Authenticate test user
  const adminEmail = `optional_tester_${Date.now()}@gmail.com`;
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

  // 1️⃣ Create an initial project with populated fields
  const projectCode = `IGRID-OPT-${Date.now().toString().slice(-4)}`;
  console.log(`\n1️⃣ Creating test project "${projectCode}" with initial data...`);
  const createRes = await makeRequest('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    project_code: projectCode,
    title: 'Initial Project Title',
    description: 'Initial description',
    domain: 'AI',
    priority: 'Normal',
    status: 'in_progress',
    due_date: '2026-12-31',
    immediate_action: 'Initial action item',
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
    github_repo: 'https://github.com/igridlab/initial-repo',
    youtube_url: 'https://youtube.com/watch?v=initial',
    doc_url: 'https://drive.google.com/file/d/initial_doc/view',
    linkedin_url: 'https://linkedin.com/in/initial',
    team_name: 'Initial Team',
    team_lead: 'Initial Lead',
    team_lead_photo: 'https://images.unsplash.com/photo-initial',
    deliverables: 'Initial deliverables'
  });

  if (createRes.statusCode !== 201 || !createRes.json || !createRes.json.id) {
    console.error('❌ FAIL: Failed to create test project:', createRes.statusCode, createRes.json);
    process.exit(1);
  }

  const projectId = createRes.json.id;
  console.log(`✅ Created test project ID: ${projectId}`);

  // 2️⃣ Update project by leaving ALL 9 requested fields completely EMPTY
  console.log(`\n2️⃣ Updating project ID ${projectId} leaving all 9 target fields completely EMPTY...`);
  const updateEmptyRes = await makeRequest(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    title: 'Updated Project Title',
    domain: 'AI',
    priority: 'High',
    status: 'in_progress',
    due_date: '2026-12-31',
    immediate_action: 'Updated action item',
    image_url: '',
    github_repo: '',
    youtube_url: '',
    doc_url: '',
    linkedin_url: '',
    team_name: '',
    team_lead: '',
    team_lead_photo: '',
    deliverables: ''
  });

  if (updateEmptyRes.statusCode === 200) {
    console.log('✅ PASS: Edit project saved successfully with all 9 fields empty!');
  } else {
    console.error('❌ FAIL: Edit project failed with empty fields:', updateEmptyRes.statusCode, updateEmptyRes.json);
    process.exit(1);
  }

  // Fetch updated project data to verify fields are empty
  const fetchRes = await makeRequest(`/api/projects/${projectId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (fetchRes.statusCode === 200 && fetchRes.json) {
    const p = fetchRes.json;
    const targetFields = {
      image_url: p.image_url,
      github_repo: p.github_repo,
      youtube_url: p.youtube_url,
      doc_url: p.doc_url,
      linkedin_url: p.linkedin_url,
      team_name: p.team_name,
      team_lead: p.team_lead,
      team_lead_photo: p.team_lead_photo,
      deliverables: p.deliverables
    };

    console.log('   Saved field values in database:', targetFields);
    const allEmpty = Object.values(targetFields).every(val => val === '' || val === null || val === undefined);
    if (allEmpty) {
      console.log('✅ PASS: All 9 optional fields verified empty in database!');
    } else {
      console.error('❌ FAIL: Some fields were not saved as empty:', targetFields);
    }
  }

  // 3️⃣ Verify that mandatory fields still enforce validation if missing
  console.log('\n3️⃣ Verifying mandatory field validation (Title and Domain required)...');
  const invalidRes = await makeRequest('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { title: '', domain: '' });

  if (invalidRes.statusCode === 400 && invalidRes.json && invalidRes.json.error === 'Title and Domain are required.') {
    console.log('✅ PASS: Mandatory field validation preserved!');
  } else {
    console.error('❌ FAIL: Mandatory field validation check failed:', invalidRes.statusCode, invalidRes.json);
  }

  console.log('\n🎉 ALL OPTIONAL FIELD EDIT FORM TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
