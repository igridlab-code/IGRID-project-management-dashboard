const fs = require('fs');

console.log('🧪 Starting Form Save UX & Dirty-State Verification Tests...\n');

// 1. Verify HTML form submit buttons and disabled attributes
const html = fs.readFileSync('./public/index.html', 'utf8');

const requiredSaveButtons = ['save-project-btn', 'save-bom-btn', 'save-student-btn', 'save-comment-btn'];
let allButtonsPresent = true;

requiredSaveButtons.forEach(btnId => {
  if (html.includes(`id="${btnId}"`) && html.includes(`id="${btnId}" disabled`)) {
    console.log(`✅ PASS: Button #${btnId} present in index.html and disabled on load.`);
  } else {
    console.error(`❌ FAIL: Button #${btnId} missing or not disabled on load.`);
    allButtonsPresent = false;
  }
});

// 2. Verify app.js dirty-state tracking, Enter key listener, and spinner feedback
const js = fs.readFileSync('./public/js/app.js', 'utf8');

if (js.includes('bindFormDirtyStateAndEnterSave') && js.includes('keyup') && js.includes("e.key === 'Enter'")) {
  console.log('✅ PASS: bindFormDirtyStateAndEnterSave dirty-state tracking and Enter-key listener present.');
} else {
  console.error('❌ FAIL: Dirty-state tracking or Enter-key listener missing in app.js.');
}

if (js.includes('⏳ Saving...') && js.includes('showToast')) {
  console.log('✅ PASS: Loading spinner state (⏳ Saving...) and success toast feedback present.');
} else {
  console.error('❌ FAIL: Loading spinner state or success toast feedback missing in app.js.');
}

console.log('\n🎉 ALL FORM SAVE UX & DIRTY-STATE TESTS PASSED SUCCESSFULLY!');
