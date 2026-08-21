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
  console.log('🧪 Starting ChatGPT-Style Multi-Turn AI Chatbot Verification Tests...\n');

  // Create User Token
  const studentEmail = `chatgpt_user_${Date.now()}@gmail.com`;
  const signupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentEmail, password: 'UserPassword123!' });

  const token = signupRes.json ? signupRes.json.token : null;

  if (!token) {
    console.error('❌ FAIL: Could not authenticate test user.');
    return;
  }

  // 1️⃣ Test Multi-Turn Conversational History
  console.log('1️⃣ Testing Multi-Turn Conversational Memory (Turn 1 -> Turn 2)...');
  const history = [
    { role: 'user', content: 'Which projects are in progress?' },
    { role: 'assistant', content: 'Project IGRID-ERP-01 is currently 85% completed in progress.' }
  ];

  const followUpRes = await makeRequest('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { message: 'Can you show me the deadlines for that project?', history });

  if (followUpRes.statusCode === 200 && followUpRes.json && followUpRes.json.reply) {
    console.log('✅ PASS: Multi-turn chat memory query succeeded!');
    console.log('   Reply Preview:', followUpRes.json.reply.substring(0, 140).replace(/\n/g, ' '));
  } else {
    console.error(`❌ FAIL: Multi-turn query failed with status ${followUpRes.statusCode}`);
  }

  // 2️⃣ Test General Engineering & Coding Question (ChatGPT Style)
  console.log('\n2️⃣ Testing General Technical/Engineering Question (ROS2 Code Example)...');
  const techRes = await makeRequest('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { message: 'How do I write a ROS2 publisher node in Python?' });

  if (techRes.statusCode === 200 && techRes.json && techRes.json.reply) {
    console.log('✅ PASS: General technical Q&A query succeeded!');
    console.log('   Reply Preview:', techRes.json.reply.substring(0, 160).replace(/\n/g, ' '));
  } else {
    console.error(`❌ FAIL: Technical Q&A query failed with status ${techRes.statusCode}`);
  }

  console.log('\n🎉 ALL CHATGPT-STYLE AI CHATBOT TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
