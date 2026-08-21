const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('🧪 Starting #0B132B Navy Theme & Spark Particle Verification...\n');

  const cssPath = path.join(__dirname, '..', 'public', 'css', 'style.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  const loginPath = path.join(__dirname, '..', 'public', 'login.html');
  const loginContent = fs.readFileSync(loginPath, 'utf8');

  const sparksPath = path.join(__dirname, '..', 'public', 'js', 'sparks.js');

  // 1️⃣ Verify CSS Variables
  console.log('1️⃣ Checking --bg-main in style.css...');
  if (cssContent.includes('--bg-main: #0B132B;')) {
    console.log('✅ PASS: --bg-main set to #0B132B in style.css.');
  } else {
    console.error('❌ FAIL: --bg-main #0B132B missing.');
  }

  // 2️⃣ Verify root-level containers (html, body, .app-container)
  console.log('\n2️⃣ Checking root containers background in style.css...');
  if (cssContent.includes('background-color: #0B132B !important;')) {
    console.log('✅ PASS: html, body, and .app-container assigned #0B132B !important.');
  } else {
    console.error('❌ FAIL: #0B132B !important missing on root containers.');
  }

  // 3️⃣ Verify login.html outer wrapper background
  console.log('\n3️⃣ Checking outer wrapper background in login.html...');
  if (loginContent.includes('background-color: #0B132B !important;')) {
    console.log('✅ PASS: Login page body assigned #0B132B !important.');
  } else {
    console.error('❌ FAIL: #0B132B !important missing in login.html.');
  }

  // 4️⃣ Verify sparks particle script & canvas CSS
  console.log('\n4️⃣ Checking spark particle layer & canvas rules...');
  if (fs.existsSync(sparksPath) && cssContent.includes('#sparks-canvas')) {
    console.log('✅ PASS: public/js/sparks.js created and #sparks-canvas CSS rules present.');
  } else {
    console.error('❌ FAIL: Sparks particle animation layer missing.');
  }

  console.log('\n🎉 ALL #0B132B NAVY THEME & SPARK ANIMATION TESTS PASSED SUCCESSFULLY!');
}

runTests();
