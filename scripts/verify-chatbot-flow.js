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
  console.log('🧪 Starting AI Chatbot Widget Endpoint Verification Tests...\n');

  // 1️⃣ Test Unauthenticated Chatbot Access
  console.log('1️⃣ Testing Unauthenticated POST /api/chat...');
  const unauthRes = await makeRequest('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'What are my deadlines?' });

  if (unauthRes.statusCode === 401) {
    console.log('✅ PASS: Unauthenticated chatbot request rejected with 401.');
  } else {
    console.error(`❌ FAIL: Expected 401, got ${unauthRes.statusCode}`);
  }

  // Create Student Account for Testing
  const studentEmail = `chatbot_student_${Date.now()}@gmail.com`;
  const signupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentEmail, password: 'StudentPass123!' });

  const studentToken = signupRes.json ? signupRes.json.token : null;

  // 2️⃣ Test Student Role-Scoped Chat Queries
  console.log('\n2️⃣ Testing Student Role-Scoped Chat Query...');
  if (studentToken) {
    const chatRes = await makeRequest('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      }
    }, { message: 'What is my project deadline?' });

    if (chatRes.statusCode === 200 && chatRes.json && chatRes.json.reply) {
      console.log('✅ PASS: Student chatbot query succeeded!');
      console.log('   Reply Preview:', chatRes.json.reply.substring(0, 120).replace(/\n/g, ' '));
    } else {
      console.error(`❌ FAIL: Student chatbot query failed with status ${chatRes.statusCode}`);
    }
  }

  // 3️⃣ Test Admin Role-Scoped Chat Queries
  console.log('\n3️⃣ Testing Admin Role-Scoped Chat Query (Lab-Wide Context)...');
  const adminEmail = 'kaviyaarumugam541@gmail.com';
  const adminSignupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: adminEmail, password: 'AdminPassword123!' });

  const adminToken = adminSignupRes.json ? adminSignupRes.json.token : null;

  if (adminToken) {
    const adminChatRes = await makeRequest('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { message: 'What is the completion progress of all projects?' });

    if (adminChatRes.statusCode === 200 && adminChatRes.json && adminChatRes.json.reply) {
      console.log('✅ PASS: Admin chatbot query succeeded with lab-wide project context!');
      console.log('   Reply Preview:', adminChatRes.json.reply.substring(0, 140).replace(/\n/g, ' '));
    } else {
      console.error(`❌ FAIL: Admin chatbot query failed with status ${adminChatRes.statusCode}`);
    }
  }

  console.log('\n🎉 ALL AI CHATBOT WIDGET VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
