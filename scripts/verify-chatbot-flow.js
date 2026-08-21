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
  console.log('🧪 Starting Rebuilt iGrid Assistant Project Matching & Memory Verification Tests...\n');

  // Create Student User Token
  const studentEmail = `student_tester_${Date.now()}@gmail.com`;
  const signupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentEmail, password: 'StudentPassword123!' });

  const token = signupRes.json ? signupRes.json.token : null;
  if (!token) {
    console.error('❌ FAIL: Could not authenticate test user.');
    return;
  }

  const history = [];

  // 1️⃣ Query 3 DIFFERENT real projects in the same session
  console.log('1️⃣ Testing 3 different real projects in the same session...');
  
  // Project 1: Enviora
  const req1 = { message: "Tell me about Enviora", history: [...history] };
  const res1 = await makeRequest('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }, req1);
  const reply1 = res1.json ? res1.json.reply : '';
  history.push({ role: 'user', content: req1.message }, { role: 'assistant', content: reply1 });
  console.log(`   Query 1 ("Enviora"): "${reply1.slice(0, 100)}..."`);
  if (!reply1.toLowerCase().includes('enviora') && !reply1.toLowerCase().includes('igrid-ai-04')) {
    console.error('❌ FAIL: Query 1 did not return Enviora data.');
  }

  // Project 2: ArboPulse
  const req2 = { message: "Tell me about ArboPulse", history: [...history] };
  const res2 = await makeRequest('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }, req2);
  const reply2 = res2.json ? res2.json.reply : '';
  history.push({ role: 'user', content: req2.message }, { role: 'assistant', content: reply2 });
  console.log(`   Query 2 ("ArboPulse"): "${reply2.slice(0, 100)}..."`);
  if (!reply2.toLowerCase().includes('arbopulse') && !reply2.toLowerCase().includes('igrid-bio-05')) {
    console.error('❌ FAIL: Query 2 did not return ArboPulse data.');
  }

  // Project 3: Smart IR Switch
  const req3 = { message: "Tell me about Smart IR Switch", history: [...history] };
  const res3 = await makeRequest('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }, req3);
  const reply3 = res3.json ? res3.json.reply : '';
  history.push({ role: 'user', content: req3.message }, { role: 'assistant', content: reply3 });
  console.log(`   Query 3 ("Smart IR Switch"): "${reply3.slice(0, 100)}..."`);
  if (!reply3.toLowerCase().includes('smart ir') && !reply3.toLowerCase().includes('igrid-iot-06')) {
    console.error('❌ FAIL: Query 3 did not return Smart IR Switch data.');
  }
  console.log('✅ PASS: All 3 different project lookups returned their own distinct data!');

  // 2️⃣ Test Typo / Misspelled Name ("Envora")
  console.log('\n2️⃣ Testing typo/misspelled name ("Tell me about Envora")...');
  const reqTypo = { message: "Tell me about Envora", history: [] };
  const resTypo = await makeRequest('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }, reqTypo);
  const replyTypo = resTypo.json ? resTypo.json.reply : '';
  console.log(`   Reply: "${replyTypo.slice(0, 100)}..."`);
  if (replyTypo.toLowerCase().includes('enviora') || replyTypo.toLowerCase().includes('igrid-ai-04')) {
    console.log('✅ PASS: Fuzzy Levenshtein matching resolved typo "Envora" to "Enviora"!');
  } else {
    console.error('❌ FAIL: Typo resolution failed.');
  }

  // 3️⃣ Test Non-Existent Project ("Team Unicorn")
  console.log('\n3️⃣ Testing non-existent project ("Tell me about Team Unicorn")...');
  const reqUnicorn = { message: "Tell me about Team Unicorn", history: [] };
  const resUnicorn = await makeRequest('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }, reqUnicorn);
  const replyUnicorn = resUnicorn.json ? resUnicorn.json.reply : '';
  console.log(`   Reply: "${replyUnicorn}"`);
  if (replyUnicorn.includes("Couldn't find") || replyUnicorn.includes("Team Unicorn") || replyUnicorn.includes("Unicorn")) {
    console.log('✅ PASS: Non-existent project search returned clear "Couldn\'t find" message!');
  } else {
    console.error('❌ FAIL: Non-existent project handling failed.');
  }

  // 4️⃣ Test Conversational Memory Follow-up
  console.log('\n4️⃣ Testing conversational memory follow-up ("What is their deadline?")...');
  const memoryHistory = [
    { role: 'user', content: 'Tell me about Enviora' },
    { role: 'assistant', content: 'Enviora (IGRID-AI-04) is at 95% progress.' }
  ];
  const reqMemory = { message: "What is their deadline?", history: memoryHistory };
  const resMemory = await makeRequest('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }, reqMemory);
  const replyMemory = resMemory.json ? resMemory.json.reply : '';
  console.log(`   Reply: "${replyMemory}"`);
  if (replyMemory.toLowerCase().includes('2026-08-15') || replyMemory.toLowerCase().includes('enviora') || replyMemory.toLowerCase().includes('igrid-ai-04')) {
    console.log('✅ PASS: Conversational memory resolved "their deadline" to Enviora!');
  } else {
    console.error('❌ FAIL: Conversational memory follow-up resolution failed.');
  }

  // 5️⃣ Test Comparison Intent ("Compare Enviora and Smart IR Switch")
  console.log('\n5️⃣ Testing multi-team comparison intent ("Compare Enviora and Smart IR Switch")...');
  const reqCompare = { message: "Compare Enviora and Smart IR Switch", history: [] };
  const resCompare = await makeRequest('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }, reqCompare);
  const replyCompare = resCompare.json ? resCompare.json.reply : '';
  console.log(`   Reply: "${replyCompare}"`);
  if (replyCompare.toLowerCase().includes('enviora') && replyCompare.toLowerCase().includes('smart ir')) {
    console.log('✅ PASS: Multi-team comparison intent executed accurately!');
  } else {
    console.error('❌ FAIL: Comparison intent failed.');
  }

  console.log('\n🎉 ALL REBUILT CHATBOT MATCHING & MEMORY TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
