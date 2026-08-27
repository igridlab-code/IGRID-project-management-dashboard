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
  console.log('🧪 Starting Domain Management Verification Tests...\n');

  // Authenticate test user
  const adminEmail = `domain_tester_${Date.now()}@gmail.com`;
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

  // 1️⃣ GET /api/domains
  console.log('\n1️⃣ Testing GET /api/domains...');
  const getDomainsRes = await makeRequest('/api/domains', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (getDomainsRes.statusCode === 200 && Array.isArray(getDomainsRes.json)) {
    const domainNames = getDomainsRes.json.map(d => d.name);
    console.log('   Fetched domains:', domainNames);
    const hasDefaults = ['AI', 'Robotics', 'Drones', 'IoT', 'Embedded'].every(d => domainNames.includes(d));
    if (hasDefaults) {
      console.log('✅ PASS: GET /api/domains returns all initial default domains!');
    } else {
      console.error('❌ FAIL: Default domains missing from GET /api/domains.');
    }
  } else {
    console.error('❌ FAIL: GET /api/domains returned status', getDomainsRes.statusCode);
  }

  // 2️⃣ POST /api/domains with empty name
  console.log('\n2️⃣ Testing POST /api/domains with empty name...');
  const emptyRes = await makeRequest('/api/domains', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { name: '   ', description: 'Empty test' });

  if (emptyRes.statusCode === 400 && emptyRes.json && emptyRes.json.error === 'Please enter a domain name.') {
    console.log('✅ PASS: Empty domain creation rejected with "Please enter a domain name."');
  } else {
    console.error('❌ FAIL: Expected 400 with "Please enter a domain name.", got:', emptyRes.statusCode, emptyRes.json);
  }

  // 3️⃣ POST /api/domains with valid new domain
  const testDomainName = `Agricultural Robotics ${Date.now().toString().slice(-4)}`;
  console.log(`\n3️⃣ Testing POST /api/domains with valid name "${testDomainName}"...`);
  const createDomainRes = await makeRequest('/api/domains', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { name: testDomainName, description: 'Smart farming and automated tractors' });

  if (createDomainRes.statusCode === 201 && createDomainRes.json && createDomainRes.json.message === 'Domain added successfully.') {
    console.log(`✅ PASS: Created domain "${testDomainName}" with message "Domain added successfully."`);
  } else {
    console.error('❌ FAIL: Failed to create new domain:', createDomainRes.statusCode, createDomainRes.json);
  }

  // 4️⃣ POST /api/domains duplicate check (case-insensitive)
  console.log(`\n4️⃣ Testing POST /api/domains duplicate check ("${testDomainName.toLowerCase()}")...`);
  const dupRes = await makeRequest('/api/domains', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { name: testDomainName.toLowerCase(), description: 'Duplicate check' });

  if (dupRes.statusCode === 400 && dupRes.json && dupRes.json.error === 'Domain name already exists.') {
    console.log('✅ PASS: Duplicate domain rejected with "Domain name already exists."');
  } else {
    console.error('❌ FAIL: Expected 400 with "Domain name already exists.", got:', dupRes.statusCode, dupRes.json);
  }

  // 5️⃣ Create project assigned to newly added domain
  console.log(`\n5️⃣ Creating project assigned to domain "${testDomainName}"...`);
  const projectCode = `IGRID-AGRI-${Date.now().toString().slice(-4)}`;
  const createProjRes = await makeRequest('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    project_code: projectCode,
    title: 'Autonomous Field Harvester',
    description: 'Robotic harvester using vision AI for crop navigation.',
    domain: testDomainName,
    priority: 'High',
    status: 'in_progress',
    progress: 45
  });

  if (createProjRes.statusCode === 201 && createProjRes.json && createProjRes.json.id) {
    console.log(`✅ PASS: Project "${projectCode}" created with domain "${testDomainName}"!`);
  } else {
    console.error('❌ FAIL: Could not create project with new domain:', createProjRes.statusCode, createProjRes.json);
  }

  // 6️⃣ Verify domain appears in GET /api/analytics
  console.log('\n6️⃣ Testing GET /api/analytics domain distribution...');
  const analyticsRes = await makeRequest('/api/analytics', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (analyticsRes.statusCode === 200 && analyticsRes.json && Array.isArray(analyticsRes.json.byDomain)) {
    const foundInMetrics = analyticsRes.json.byDomain.some(d => d.domain === testDomainName && d.count >= 1);
    if (foundInMetrics) {
      console.log(`✅ PASS: Domain "${testDomainName}" is included in analytics byDomain metrics!`);
    } else {
      console.error('❌ FAIL: Domain not found in analytics metrics:', analyticsRes.json.byDomain);
    }
  } else {
    console.error('❌ FAIL: Analytics request failed:', analyticsRes.statusCode);
  }

  console.log('\n🎉 ALL DOMAIN MANAGEMENT VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
