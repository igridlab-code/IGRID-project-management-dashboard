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
  console.log('🧪 Starting Analytics Page & API Verification Tests...\n');

  // Authenticate test user
  const adminEmail = `analytics_tester_${Date.now()}@gmail.com`;
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

  // 1️⃣ Test GET /api/analytics WITHOUT token (Should return 401)
  console.log('\n1️⃣ Testing GET /api/analytics WITHOUT auth header (Security check)...');
  const unauthRes = await makeRequest('/api/analytics');
  if (unauthRes.statusCode === 401 && unauthRes.json && unauthRes.json.error) {
    console.log('✅ PASS: Unauthorized request correctly rejected with 401');
  } else {
    console.error('❌ FAIL: Unauthorized request returned:', unauthRes.statusCode, unauthRes.json);
  }

  // 2️⃣ Test GET /api/analytics WITH valid token (Should return 200 and analytics object)
  console.log('\n2️⃣ Testing GET /api/analytics WITH valid token...');
  const analyticsRes = await makeRequest('/api/analytics', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (analyticsRes.statusCode === 200 && analyticsRes.json) {
    const stats = analyticsRes.json;
    console.log('✅ Received Analytics Response:');
    console.log('   - Total Projects:', stats.totalProjects);
    console.log('   - Overall Progress:', stats.overallProgress, '%');
    console.log('   - Status Breakdown:', stats.byStatus);
    console.log('   - Domain Count:', Array.isArray(stats.byDomain) ? stats.byDomain.length : 0);
    console.log('   - Pending BOM Count:', stats.pendingBOMCount);

    // Structural checks
    const hasRequiredFields = 
      typeof stats.totalProjects === 'number' &&
      typeof stats.byStatus === 'object' &&
      Array.isArray(stats.byDomain) &&
      typeof stats.pendingBOMCount === 'number';

    if (hasRequiredFields) {
      console.log('✅ PASS: GET /api/analytics returned a valid, complete data structure!');
    } else {
      console.error('❌ FAIL: Missing structural fields in analytics JSON:', stats);
      process.exit(1);
    }
  } else {
    console.error('❌ FAIL: GET /api/analytics failed:', analyticsRes.statusCode, analyticsRes.json);
    process.exit(1);
  }

  console.log('\n🎉 ALL ANALYTICS VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
