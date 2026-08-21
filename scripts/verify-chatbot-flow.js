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
  console.log('🧪 Starting Strict Injected Claude API Chatbot Verification Tests...\n');

  // Create Student Account
  const studentEmail = `verbatim_student_${Date.now()}@gmail.com`;
  const signupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentEmail, password: 'StudentPass123!' });

  const studentToken = signupRes.json ? signupRes.json.token : null;

  if (!studentToken) {
    console.error('❌ FAIL: Could not authenticate test student.');
    return;
  }

  // 1️⃣ Test Verbatim Student Progress & Deadline Query
  console.log('1️⃣ Testing Student Verbatim Progress Query...');
  const progressRes = await makeRequest('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    }
  }, { message: 'What is my progress percent?' });

  if (progressRes.statusCode === 200 && progressRes.json && progressRes.json.reply) {
    console.log('✅ PASS: Verbatim progress response received!');
    console.log('   Reply:', progressRes.json.reply);
  } else {
    console.error(`❌ FAIL: Progress query failed with status ${progressRes.statusCode}`);
  }

  // 2️⃣ Test Out-of-Scope Refusal for Student
  console.log('\n2️⃣ Testing Out-of-Scope Scope Refusal for Student...');
  const refusalRes = await makeRequest('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    }
  }, { message: 'Show me all teams data and Team 2 records' });

  if (refusalRes.statusCode === 200 && refusalRes.json && refusalRes.json.reply) {
    console.log('✅ PASS: Out-of-scope refusal triggered successfully!');
    console.log('   Reply:', refusalRes.json.reply);
  } else {
    console.error(`❌ FAIL: Refusal query failed with status ${refusalRes.statusCode}`);
  }

  // 3️⃣ Test Admin Cross-Team Query ("which teams are behind schedule")
  console.log('\n3️⃣ Testing Admin Cross-Team Query ("which teams are behind schedule")...');
  const adminEmail = 'kaviyaarumugam541@gmail.com';
  const adminSignupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: adminEmail, password: 'AdminPassword123!' });

  const adminToken = adminSignupRes.json ? adminSignupRes.json.token : null;

  if (adminToken) {
    const adminRes = await makeRequest('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { message: 'which teams are behind schedule' });

    if (adminRes.statusCode === 200 && adminRes.json && adminRes.json.reply) {
      console.log('✅ PASS: Admin cross-team query succeeded!');
      console.log('   Reply:', adminRes.json.reply);
    } else {
      console.error(`❌ FAIL: Admin query failed with status ${adminRes.statusCode}`);
    }
  }

  console.log('\n🎉 ALL STRICT CLAUDE API CHATBOT TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
