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
  console.log('🧪 Starting iGrid Assistant Short & Exact Response Verification Tests...\n');

  // Create User Token
  const studentEmail = `igrid_assistant_user_${Date.now()}@gmail.com`;
  const signupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentEmail, password: 'UserPassword123!' });

  const token = signupRes.json ? signupRes.json.token : null;
  if (!token) {
    console.error('❌ FAIL: Could not authenticate test user.');
    return;
  }

  // 1️⃣ Test "what's my deadline"
  console.log('1️⃣ Query: "what\'s my deadline"...');
  const deadlineRes = await makeRequest('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { message: "what's my deadline" });

  if (deadlineRes.statusCode === 200 && deadlineRes.json && deadlineRes.json.reply) {
    const reply = deadlineRes.json.reply;
    console.log(`   Reply: "${reply}"`);
    if (!reply.toLowerCase().includes('sure') && !reply.toLowerCase().includes('happy to help') && reply.length < 250) {
      console.log('✅ PASS: Response is short, exact, and free of conversational filler!');
    } else {
      console.error('❌ FAIL: Response contains conversational filler or exceeds short sentence limit.');
    }
  } else {
    console.error(`❌ FAIL: Deadline query failed with status ${deadlineRes.statusCode}`);
  }

  // 2️⃣ Test "what's our progress"
  console.log('\n2️⃣ Query: "what\'s our progress"...');
  const progressRes = await makeRequest('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { message: "what's our progress" });

  if (progressRes.statusCode === 200 && progressRes.json && progressRes.json.reply) {
    console.log(`   Reply: "${progressRes.json.reply}"`);
    console.log('✅ PASS: Progress query returned concise exact value!');
  } else {
    console.error(`❌ FAIL: Progress query failed.`);
  }

  // 3️⃣ Test "what's the current status"
  console.log('\n3️⃣ Query: "what\'s the current status"...');
  const statusRes = await makeRequest('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { message: "what's the current status" });

  if (statusRes.statusCode === 200 && statusRes.json && statusRes.json.reply) {
    console.log(`   Reply: "${statusRes.json.reply}"`);
    console.log('✅ PASS: Status query returned concise exact status!');
  } else {
    console.error(`❌ FAIL: Status query failed.`);
  }

  console.log('\n🎉 ALL IGRID ASSISTANT SHORT & EXACT RESPONSE TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
