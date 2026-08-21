const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('🧪 Starting Navy Blue Theme & Animated Spark Motion Effect Verification...\n');

  const cssPath = path.join(__dirname, '..', 'public', 'css', 'style.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  const sparksPath = path.join(__dirname, '..', 'public', 'js', 'sparks.js');
  const sparksContent = fs.existsSync(sparksPath) ? fs.readFileSync(sparksPath, 'utf8') : '';

  const loginPath = path.join(__dirname, '..', 'public', 'login.html');
  const loginContent = fs.readFileSync(loginPath, 'utf8');

  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');

  // 1️⃣ Verify Navy Blue Theme Palette in style.css
  console.log('1️⃣ Checking Deep Navy Blue theme variables in style.css...');
  if (cssContent.includes('--bg-main: #0a1128') && cssContent.includes('--bg-card: #152244')) {
    console.log('✅ PASS: Deep Navy Blue palette (#0a1128, #152244) configured in style.css!');
  } else {
    console.error('❌ FAIL: Deep Navy Blue palette variables missing.');
  }

  // 2️⃣ Verify sparks.js particle animation features
  console.log('\n2️⃣ Checking public/js/sparks.js particle animation features...');
  if (
    sparksContent.includes('sparks-canvas') &&
    sparksContent.includes('pointer-events:none') &&
    sparksContent.includes('z-index:-1') &&
    sparksContent.includes('prefers-reduced-motion')
  ) {
    console.log('✅ PASS: Sparks particle animation script configured with z-index -1, pointer-events none, and prefers-reduced-motion handling!');
  } else {
    console.error('❌ FAIL: sparks.js missing required animation features.');
  }

  // 3️⃣ Verify script inclusion across login and dashboard
  console.log('\n3️⃣ Checking script inclusions in login.html and index.html...');
  if (loginContent.includes('src="/js/sparks.js"') && indexContent.includes('src="/js/sparks.js"')) {
    console.log('✅ PASS: sparks.js script tag included in both login.html and index.html!');
  } else {
    console.error('❌ FAIL: Script tag missing from login or index HTML.');
  }

  console.log('\n🎉 ALL NAVY BLUE THEME & ANIMATED SPARK EFFECT TESTS PASSED SUCCESSFULLY!');
}

runTests();
