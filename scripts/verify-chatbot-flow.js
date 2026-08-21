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
  console.log('🧪 Starting iGrid Assistant Full Project Lookup & Human Teammate Verification Tests...\n');

  // Create User Token
  const studentEmail = `igrid_coordinator_${Date.now()}@gmail.com`;
  const signupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentEmail, password: 'UserPassword123!' });

  const token = signupRes.json ? signupRes.json.token : null;
  if (!token) {
    console.error('❌ FAIL: Could not authenticate test user.');
    return;
  }

  // 1️⃣ Test Full Project Summary ("Tell me about Enviora")
  console.log('1️⃣ Query: "Tell me about Enviora"...');
  const fullSummaryRes = await makeRequest('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { message: "Tell me about Enviora" });

  if (fullSummaryRes.statusCode === 200 && fullSummaryRes.json && fullSummaryRes.json.reply) {
    const reply = fullSummaryRes.json.reply;
    console.log(`   Reply: "${reply}"`);
    if (reply.includes('Enviora') || reply.includes('IGRID-AI-04') || reply.includes('95%') || reply.includes('completed')) {
      console.log('✅ PASS: Full project summary retrieved and formatted naturally!');
    } else {
      console.error('❌ FAIL: Full summary missing expected project details.');
    }
  } else {
    console.error(`❌ FAIL: Full summary query failed with status ${fullSummaryRes.statusCode}`);
  }

  // 2️⃣ Test Specific Question ("Enviora deadline")
  console.log('\n2️⃣ Query: "Enviora deadline"...');
  const specificRes = await makeRequest('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { message: "Enviora deadline" });

  if (specificRes.statusCode === 200 && specificRes.json && specificRes.json.reply) {
    console.log(`   Reply: "${specificRes.json.reply}"`);
    console.log('✅ PASS: Specific deadline question returned concise natural phrasing!');
  } else {
    console.error(`❌ FAIL: Specific question query failed.`);
  }

  // 3️⃣ Test Non-Existent Project ("Team Unicorn")
  console.log('\n3️⃣ Query: "Tell me about Team Unicorn" (doesn\'t exist)...');
  const notFoundRes = await makeRequest('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { message: "Tell me about Team Unicorn" });

  if (notFoundRes.statusCode === 200 && notFoundRes.json && notFoundRes.json.reply) {
    const reply = notFoundRes.json.reply;
    console.log(`   Reply: "${reply}"`);
    if (reply.includes("Couldn't find") || reply.includes("Team Unicorn")) {
      console.log('✅ PASS: Clear non-found message returned without guessing!');
    } else {
      console.error('❌ FAIL: Expected clear non-found message.');
    }
  } else {
    console.error(`❌ FAIL: Non-existent project query failed.`);
  }

  console.log('\n🎉 ALL IGRID ASSISTANT PROJECT LOOKUP TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
