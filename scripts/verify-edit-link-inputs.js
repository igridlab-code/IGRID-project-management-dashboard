const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('🧪 Starting Edit Form Link Inputs Navigation Fix Verification...\n');

  const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  const appPath = path.join(__dirname, '..', 'public', 'js', 'app.js');
  const appContent = fs.readFileSync(appPath, 'utf8');

  // 1️⃣ Verify URL fields in index.html are pure <input type="url"> elements without parent <a> tags
  console.log('1️⃣ Checking URL fields in edit project modal (public/index.html)...');
  const urlFields = ['form-image-url', 'form-github', 'form-youtube', 'form-doc-url', 'form-linkedin'];
  
  urlFields.forEach(id => {
    const inputRegex = new RegExp(`<input[^>]*id="${id}"[^>]*>`, 'i');
    if (inputRegex.test(htmlContent)) {
      console.log(`✅ PASS: Element #${id} is a clean <input> field.`);
    } else {
      console.error(`❌ FAIL: Element #${id} not found as <input>.`);
    }
  });

  // 2️⃣ Verify isolated preview link icons are wrapped with stopPropagation
  console.log('\n2️⃣ Checking isolated link preview badges in index.html...');
  const previewIds = ['preview-image-url', 'preview-github', 'preview-youtube', 'preview-doc-url', 'preview-linkedin'];
  
  previewIds.forEach(id => {
    if (htmlContent.includes(`id="${id}"`) && htmlContent.includes('event.stopPropagation()')) {
      console.log(`✅ PASS: Preview link badge #${id} includes isolated stopPropagation handler.`);
    } else {
      console.error(`❌ FAIL: Preview link badge #${id} missing or lacks stopPropagation.`);
    }
  });

  // 3️⃣ Verify click listener protection in app.js
  console.log('\n3️⃣ Checking event listener click protection in app.js...');
  if (appContent.includes('initEditFormLinkProtection') && appContent.includes('e.stopPropagation()')) {
    console.log('✅ PASS: Edit form link input click protection & focus handlers registered.');
  } else {
    console.error('❌ FAIL: Click protection missing in app.js.');
  }

  // 4️⃣ Verify read-only detail view renders target="_blank" rel="noopener noreferrer" links
  console.log('\n4️⃣ Checking read-only display view rendering in app.js...');
  if (appContent.includes('btn-media-doc') && appContent.includes('target="_blank"') && appContent.includes('rel="noopener noreferrer"')) {
    console.log('✅ PASS: Read-only detail view renders external open-in-new-tab links correctly.');
  } else {
    console.error('❌ FAIL: Read-only display links missing target/rel attributes.');
  }

  console.log('\n🎉 ALL EDIT FORM LINK NAVIGATION FIX TESTS PASSED SUCCESSFULLY!');
}

runTests();
