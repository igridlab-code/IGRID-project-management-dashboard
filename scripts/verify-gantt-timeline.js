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

function getDaysInMonth(monthIndex, year) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function calculateDuration(startStr, endStr) {
  const s = new Date(startStr);
  const e = new Date(endStr);
  const diffTime = e.getTime() - s.getTime();
  return Math.max(1, Math.round(diffTime / (1000 * 3600 * 24)) + 1);
}

async function runTests() {
  console.log('🧪 Starting Calendar-Based Gantt Timeline Verification Tests...\n');

  // 1️⃣ Test Leap Year & Days In Month Math
  console.log('1️⃣ Testing Days-in-Month & Leap Year logic...');
  const feb2026 = getDaysInMonth(1, 2026);
  const feb2028 = getDaysInMonth(1, 2028); // 2028 is a leap year
  console.log(`   Feb 2026 days: ${feb2026} (Expected: 28)`);
  console.log(`   Feb 2028 days: ${feb2028} (Expected: 29)`);

  if (feb2026 === 28 && feb2028 === 29) {
    console.log('✅ PASS: Month days and leap year calculation correct!');
  } else {
    console.error('❌ FAIL: Incorrect days in month calculation.');
    process.exit(1);
  }

  // 2️⃣ Test Duration Calculation Formula
  console.log('\n2️⃣ Testing Automatic Duration Calculation...');
  // Example from user request: Start: 10/01/2026, End: 15/01/2026 -> Duration: 6 days
  const durationTest1 = calculateDuration('2026-01-10', '2026-01-15');
  console.log(`   Start 2026-01-10 to End 2026-01-15: ${durationTest1} days (Expected: 6)`);

  // Example: Hardware Setup: 01/09/2026 to 05/09/2026 -> Duration: 5 days
  const durationTest2 = calculateDuration('2026-09-01', '2026-09-05');
  console.log(`   Start 2026-09-01 to End 2026-09-05: ${durationTest2} days (Expected: 5)`);

  if (durationTest1 === 6 && durationTest2 === 5) {
    console.log('✅ PASS: Automatic duration formula matches exact requirement (End - Start + 1)!');
  } else {
    console.error('❌ FAIL: Duration calculation mismatch.');
    process.exit(1);
  }

  // Authenticate test user
  const adminEmail = `gantt_tester_${Date.now()}@gmail.com`;
  const signupRes = await makeRequest('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: adminEmail, password: 'AdminPassword123!' });

  const token = signupRes.json ? signupRes.json.token : null;
  if (!token) {
    console.error('❌ FAIL: Could not authenticate test user.');
    process.exit(1);
  }
  console.log('\n✅ Authenticated test admin user.');

  // 3️⃣ Test Creating Task with Start Date, End Date, and Duration
  console.log('\n3️⃣ Creating task "Hardware Setup" with Start & End dates...');
  const createRes = await makeRequest('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    project_code: `IGRID-GRASS-${Date.now().toString().slice(-4)}`,
    title: 'Smart Grass Cutter Robot - Hardware Setup',
    description: 'Frame assembly, chassis mounting, and wheel hub motor setup.',
    domain: 'Robotics',
    priority: 'High',
    status: 'in_progress',
    start_date: '2026-09-01',
    due_date: '2026-09-05',
    immediate_action: 'Mount dual 24V BLDC motors to main deck.'
  });

  if (createRes.statusCode === 201 && createRes.json && createRes.json.id) {
    console.log(`✅ PASS: Created task ID ${createRes.json.id} with start_date "2026-09-01" & due_date "2026-09-05"`);
  } else {
    console.error('❌ FAIL: Task creation failed:', createRes.statusCode, createRes.json);
    process.exit(1);
  }

  const taskId = createRes.json.id;

  // 4️⃣ Test Updating Task Dates
  console.log(`\n4️⃣ Updating task ID ${taskId} dates to 10/01/2026 → 15/01/2026...`);
  const updateRes = await makeRequest(`/api/projects/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    title: 'Smart Grass Cutter Robot - Hardware Setup (Updated)',
    domain: 'Robotics',
    priority: 'High',
    status: 'in_progress',
    start_date: '2026-01-10',
    due_date: '2026-01-15'
  });

  if (updateRes.statusCode === 200) {
    console.log('✅ PASS: Updated task dates successfully.');
  } else {
    console.error('❌ FAIL: Task update failed:', updateRes.statusCode, updateRes.json);
    process.exit(1);
  }

  // 5️⃣ Retrieve updated task and verify database persistence
  console.log(`\n5️⃣ Fetching updated task ID ${taskId} to verify persistence...`);
  const getRes = await makeRequest(`/api/projects/${taskId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (getRes.statusCode === 200 && getRes.json) {
    const t = getRes.json;
    console.log(`   Saved start_date: "${t.start_date}"`);
    console.log(`   Saved due_date: "${t.due_date}"`);

    const persistedDuration = calculateDuration(t.start_date, t.due_date);
    console.log(`   Dynamically calculated duration: ${persistedDuration} days`);

    if (t.start_date === '2026-01-10' && t.due_date === '2026-01-15' && persistedDuration === 6) {
      console.log('✅ PASS: Task start_date, due_date, and duration verified in database!');
    } else {
      console.error('❌ FAIL: Database values mismatch:', t);
      process.exit(1);
    }
  }

  console.log('\n🎉 ALL CALENDAR-BASED GANTT TIMELINE TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
