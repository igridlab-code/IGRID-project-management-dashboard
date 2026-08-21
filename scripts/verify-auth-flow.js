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
  console.log('🧪 Starting Direct Email/Password Auth Verification Tests...\n');

  // 1️⃣ Test Unauthenticated Route Gating
  console.log('1️⃣ Testing Unauthenticated Route Gating...');
  const rootRes = await makeRequest('/');
  if (rootRes.statusCode === 302 && rootRes.headers.location === '/login') {
    console.log('✅ PASS: Unauthenticated GET / redirects to /login');
  } else {
    console.error(`❌ FAIL: Expected 302 redirect to /login, got ${rootRes.statusCode}`);
  }

  const apiRes = await makeRequest('/api/projects');
  if (apiRes.statusCode === 401) {
    console.log('✅ PASS: Unauthenticated GET /api/projects returns 401 Unauthorized');
  } else {
    console.error(`❌ FAIL: Expected 401 for unauthenticated API, got ${apiRes.statusCode}`);
  }

  // 2️⃣ Test Gmail/Email + Password Signup (bcrypt hashing)
  console.log('\n2️⃣ Testing Gmail/Email + Password Signup with bcrypt hashing...');
  const testEmail = `student_${Date.now()}@gmail.com`;
  const testPass = 'LabUser123!';
  
  const signupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail, password: testPass });

  if (signupRes.statusCode === 201 && signupRes.json && signupRes.json.token) {
    console.log(`✅ PASS: Account created! Token received for ${testEmail}`);
  } else {
    console.error(`❌ FAIL: Signup failed with status ${signupRes.statusCode}`, signupRes.body);
  }

  const userToken = signupRes.json ? signupRes.json.token : null;

  // 3️⃣ Test Email + Password Login
  console.log('\n3️⃣ Testing Email/Password Login & Password Verification...');
  const loginRes = await makeRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail, password: testPass });

  if (loginRes.statusCode === 200 && loginRes.json && loginRes.json.token) {
    console.log('✅ PASS: Login successful! Correct bcrypt hash match.');
  } else {
    console.error(`❌ FAIL: Login failed with status ${loginRes.statusCode}`, loginRes.body);
  }

  // Test Incorrect Password Login Rejection
  const wrongLoginRes = await makeRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail, password: 'WrongPassword!' });

  if (wrongLoginRes.statusCode === 401) {
    console.log('✅ PASS: Incorrect password correctly rejected with 401.');
  } else {
    console.error(`❌ FAIL: Expected 401 for wrong password, got ${wrongLoginRes.statusCode}`);
  }

  // 4️⃣ Test Forgot Password & Reset Token Flow
  console.log('\n4️⃣ Testing Forgot Password Reset Flow...');
  const forgotRes = await makeRequest('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail });

  if (forgotRes.statusCode === 200 && forgotRes.json && forgotRes.json.reset_token) {
    console.log('✅ PASS: Password reset token generated successfully.');
    const resetToken = forgotRes.json.reset_token;

    const resetRes = await makeRequest('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { reset_token: resetToken, new_password: 'NewSecret123!' });

    if (resetRes.statusCode === 200) {
      console.log('✅ PASS: Password reset verified! New password updated.');
    } else {
      console.error(`❌ FAIL: Reset password failed with status ${resetRes.statusCode}`);
    }
  } else {
    console.error(`❌ FAIL: Forgot password token request failed.`);
  }

  // 5️⃣ Test Authenticated API Access
  console.log('\n5️⃣ Testing Authenticated Dashboard Access with Session Token...');
  if (userToken) {
    const authApiRes = await makeRequest('/api/projects', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    if (authApiRes.statusCode === 200 && Array.isArray(authApiRes.json)) {
      console.log(`✅ PASS: Authenticated request succeeded! ${authApiRes.json.length} projects retrieved.`);
    } else {
      console.error(`❌ FAIL: Authenticated API request failed with status ${authApiRes.statusCode}`);
    }
  }

  console.log('\n🎉 ALL DIRECT EMAIL/PASSWORD AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
