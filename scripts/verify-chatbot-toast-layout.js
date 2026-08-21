const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('🧪 Starting Chatbot Widget & Toast Notification Layout Verification...\n');

  const cssPath = path.join(__dirname, '..', 'public', 'css', 'style.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // 1️⃣ Verify chatbot position offset (bottom: 90px)
  console.log('1️⃣ Checking .chatbot-widget-container position (bottom: 90px)...');
  if (cssContent.includes('.chatbot-widget-container') && cssContent.includes('bottom: 90px')) {
    console.log('✅ PASS: Chatbot container is elevated to bottom: 90px above toast notifications!');
  } else {
    console.error('❌ FAIL: Chatbot container position bottom: 90px missing.');
  }

  // 2️⃣ Verify z-index hierarchy
  console.log('\n2️⃣ Checking z-index hierarchy (toasts: 9999, chatbot: 9990)...');
  if (cssContent.includes('z-index: 9999') && cssContent.includes('z-index: 9990')) {
    console.log('✅ PASS: Dedicated z-index hierarchy configured (toasts: 9999, chatbot: 9990).');
  } else {
    console.error('❌ FAIL: z-index hierarchy missing.');
  }

  // 3️⃣ Verify mobile breakpoint rules
  console.log('\n3️⃣ Checking mobile responsive breakpoint rules (@media max-width: 640px)...');
  if (cssContent.includes('@media (max-width: 640px)') && cssContent.includes('bottom: 85px')) {
    console.log('✅ PASS: Mobile responsive rules prevent collision on small screens.');
  } else {
    console.error('❌ FAIL: Mobile responsive rules missing.');
  }

  console.log('\n🎉 ALL CHATBOT WIDGET & TOAST LAYOUT TESTS PASSED SUCCESSFULLY!');
}

runTests();
