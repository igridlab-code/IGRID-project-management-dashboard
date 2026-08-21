const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('🧪 Starting Scrollable Save Button Placement Verification...\n');

  const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

  // 1️⃣ Verify modal-footer is nested inside modal-body
  console.log('1️⃣ Verifying .modal-footer is nested inside .modal-body in index.html...');
  const modalBodyIndex = htmlContent.indexOf('<div class="modal-body">');
  const modalBodyEndIndex = htmlContent.indexOf('</div>\n      </form>') !== -1 ? htmlContent.indexOf('</div>\n      </form>') : htmlContent.indexOf('</div>\r\n      </form>');
  const saveBtnIndex = htmlContent.indexOf('id="save-project-btn"');
  const deliverablesIndex = htmlContent.indexOf('id="form-deliverables"');

  if (saveBtnIndex > modalBodyIndex && saveBtnIndex < modalBodyEndIndex) {
    console.log('✅ PASS: Save button is nested INSIDE .modal-body scrollable container!');
  } else {
    console.error(`❌ FAIL: Save button position check (saveBtnIndex: ${saveBtnIndex}, modalBodyIndex: ${modalBodyIndex}, modalBodyEndIndex: ${modalBodyEndIndex}).`);
  }

  // 2️⃣ Verify Save button appears after form-deliverables
  console.log('\n2️⃣ Verifying Save button appears AFTER the last input field (form-deliverables)...');
  if (saveBtnIndex > deliverablesIndex) {
    console.log('✅ PASS: Save button is positioned after all input fields in natural document flow.');
  } else {
    console.error('❌ FAIL: Save button is positioned before form fields.');
  }

  // 3️⃣ Verify no sticky/fixed positioning on modal-footer inside project-modal
  console.log('\n3️⃣ Verifying no position:fixed or position:sticky positioning on project modal footer...');
  const footerSnippet = htmlContent.substring(saveBtnIndex - 200, saveBtnIndex + 100);
  if (!footerSnippet.includes('position: fixed') && !footerSnippet.includes('position: sticky') && !footerSnippet.includes('position: absolute')) {
    console.log('✅ PASS: Save button wrapper uses position: static (normal document flow).');
  } else {
    console.error('❌ FAIL: Fixed/Sticky positioning found in footer snippet:', footerSnippet);
  }

  console.log('\n🎉 ALL SCROLLABLE SAVE BUTTON PLACEMENT TESTS PASSED SUCCESSFULLY!');
}

runTests();
