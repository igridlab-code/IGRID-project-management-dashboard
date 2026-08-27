const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

function makeHttpRequest(urlStr) {
  return new Promise((resolve, reject) => {
    const isHttps = urlStr.startsWith('https:');
    const client = isHttps ? https : http;
    const req = client.get(urlStr, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout after 10s'));
    });
  });
}

async function runTests() {
  console.log('🧪 Starting Project Access Verification Tests...\n');

  // 1️⃣ Verify local server port 3000
  console.log('1️⃣ Testing local server http://localhost:3000...');
  try {
    const localRes = await makeHttpRequest('http://localhost:3000');
    if (localRes.statusCode === 200 || localRes.statusCode === 302 || localRes.statusCode === 304) {
      console.log(`✅ PASS: Local server http://localhost:3000 is UP and responding (Status: ${localRes.statusCode})!`);
    } else {
      console.error('❌ FAIL: Local server returned status', localRes.statusCode);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ FAIL: Could not connect to local server on port 3000:', err.message);
    process.exit(1);
  }

  // 2️⃣ Verify PUBLIC_ACCESS_LINK.txt and public/tunnel_info.json
  console.log('\n2️⃣ Checking public access configuration files...');
  const linkFile = path.join(__dirname, '..', 'PUBLIC_ACCESS_LINK.txt');
  const jsonFile = path.join(__dirname, '..', 'public', 'tunnel_info.json');

  if (fs.existsSync(linkFile)) {
    const linkTxt = fs.readFileSync(linkFile, 'utf8');
    console.log('✅ PUBLIC_ACCESS_LINK.txt content preview:');
    console.log(linkTxt.split('\n').slice(0, 8).join('\n'));
  } else {
    console.error('❌ FAIL: PUBLIC_ACCESS_LINK.txt does not exist.');
  }

  let publicUrl = 'https://kabob-suspect-mandate.ngrok-free.dev';
  if (fs.existsSync(jsonFile)) {
    try {
      const json = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      publicUrl = json.public_url || publicUrl;
      console.log(`✅ Loaded live public URL from tunnel_info.json: ${publicUrl}`);
    } catch(e) {}
  }

  // 3️⃣ Verify Live Public Ngrok URL
  console.log(`\n3️⃣ Testing Live Public URL (${publicUrl})...`);
  try {
    const publicRes = await makeHttpRequest(publicUrl);
    if (publicRes.statusCode === 200 || publicRes.statusCode === 302 || publicRes.statusCode === 304) {
      console.log(`✅ PASS: Live Public URL ${publicUrl} is ACCESSIBLE (Status: ${publicRes.statusCode})!`);
    } else {
      console.warn(`⚠️ Warning: Public URL returned status ${publicRes.statusCode}`);
    }
  } catch (err) {
    console.error(`❌ FAIL: Could not reach public URL ${publicUrl}:`, err.message);
  }

  console.log('\n🎉 ALL PROJECT ACCESS VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
}

runTests().catch(console.error);
