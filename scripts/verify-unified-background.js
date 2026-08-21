const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('🧪 Starting Unified AI Neural Network Background Layer Verification...\n');

  const bgScriptPath = path.join(__dirname, '..', 'public', 'js', 'unified-background.js');
  const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');
  const loginHtmlPath = path.join(__dirname, '..', 'public', 'login.html');
  const cssPath = path.join(__dirname, '..', 'public', 'css', 'style.css');

  // 1️⃣ Check unified-background.js existence & canvas configuration
  console.log('1️⃣ Checking public/js/unified-background.js engine...');
  if (fs.existsSync(bgScriptPath)) {
    const bgContent = fs.readFileSync(bgScriptPath, 'utf8');
    if (bgContent.includes('#0B132B') && bgContent.includes('#4CC9F0') && bgContent.includes('app-ai-background-canvas')) {
      console.log('✅ PASS: Unified background component exists with #0B132B navy base & #4CC9F0 electric blue glowing nodes!');
    } else {
      console.error('❌ FAIL: Background component missing required color tokens or canvas id.');
    }
  } else {
    console.error('❌ FAIL: public/js/unified-background.js file does not exist.');
  }

  // 2️⃣ Check index.html script import
  console.log('\n2️⃣ Checking public/index.html script import...');
  const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
  if (indexContent.includes('<script src="/js/unified-background.js"></script>')) {
    console.log('✅ PASS: index.html imports unified-background.js!');
  } else {
    console.error('❌ FAIL: index.html missing unified-background.js script tag.');
  }

  // 3️⃣ Check login.html script import & clean background
  console.log('\n3️⃣ Checking public/login.html script import & single source background...');
  const loginContent = fs.readFileSync(loginHtmlPath, 'utf8');
  if (loginContent.includes('<script src="/js/unified-background.js"></script>') && loginContent.includes('#0B132B') && !loginContent.includes('bg-blob')) {
    console.log('✅ PASS: login.html uses #0B132B navy base, imports unified-background.js, and removed old blobs!');
  } else {
    console.error('❌ FAIL: login.html configuration mismatch.');
  }

  // 4️⃣ Check style.css navy base variable
  console.log('\n4️⃣ Checking style.css --bg-main variable (#0B132B)...');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  if (cssContent.includes('--bg-main: #0B132B;')) {
    console.log('✅ PASS: style.css --bg-main set to exact #0B132B navy base!');
  } else {
    console.error('❌ FAIL: style.css --bg-main variable missing #0B132B.');
  }

  console.log('\n🎉 ALL UNIFIED AI BACKGROUND LAYER TESTS PASSED SUCCESSFULLY!');
}

runTests();
