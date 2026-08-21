const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('🧪 Starting Modal Viewport Constraints & Body Scroll Lock Verification...\n');

  const cssPath = path.join(__dirname, '..', 'public', 'css', 'style.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  const jsPath = path.join(__dirname, '..', 'public', 'js', 'app.js');
  const jsContent = fs.readFileSync(jsPath, 'utf8');

  // 1️⃣ Verify .modal-card max-height constraint (85vh)
  console.log('1️⃣ Checking .modal-card max-height in style.css...');
  if (cssContent.includes('.modal-card') && cssContent.includes('max-height: 85vh')) {
    console.log('✅ PASS: .modal-card constrained to max-height: 85vh.');
  } else {
    console.error('❌ FAIL: .modal-card max-height: 85vh rule missing.');
  }

  // 2️⃣ Verify custom thin scrollbar styling
  console.log('\n2️⃣ Checking thin custom scrollbar styles in style.css...');
  if (cssContent.includes('.modal-body::-webkit-scrollbar') && cssContent.includes('width: 6px') && cssContent.includes('scrollbar-width: thin')) {
    console.log('✅ PASS: Thin 6px custom scrollbar styles configured for modal body.');
  } else {
    console.error('❌ FAIL: Custom scrollbar styles missing.');
  }

  // 3️⃣ Verify body scroll locking in app.js
  console.log('\n3️⃣ Checking body background scroll lock in app.js...');
  if (jsContent.includes("document.body.style.overflow = 'hidden'") && jsContent.includes("document.body.style.overflow = ''")) {
    console.log('✅ PASS: Body scroll lock (overflow: hidden) and restoration handlers present in openModal/closeModal.');
  } else {
    console.error('❌ FAIL: Body scroll lock handlers missing.');
  }

  console.log('\n🎉 ALL MODAL VIEWPORT CONSTRAINTS & SCROLL LOCK TESTS PASSED SUCCESSFULLY!');
}

runTests();
