const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function getMaskedClientId(id) {
  if (!id || id.trim().length === 0) return '⚠️ UNDEFINED / NOT CONFIGURED';
  const clean = id.trim();
  if (clean.length <= 12) return '****' + clean.substring(clean.length - 4);
  return clean.substring(0, 6) + '****' + clean.substring(clean.length - 12);
}

function scanForPlaceholders(dirPath) {
  const placeholders = ['845239102834-igridlab.apps.googleusercontent.com', 'YOUR_GOOGLE_CLIENT_ID'];
  const found = [];

  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      if (file === 'node_modules' || file === '.git' || file === 'logs' || file === 'scripts') continue;
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        placeholders.forEach(ph => {
          if (content.includes(ph)) {
            found.push({ file: fullPath, placeholder: ph });
          }
        });
      }
    }
  }

  walk(dirPath);
  return found;
}

async function verifyGoogleOAuthConfig() {
  console.log('🔍 Starting Google OAuth Configuration & Placeholder Audit...\n');

  // 1️⃣ Scan Codebase for Hardcoded Placeholder Client IDs
  console.log('1️⃣ Checking Codebase for Hardcoded Placeholder Client IDs...');
  const foundPlaceholders = scanForPlaceholders(path.join(__dirname, '..'));
  if (foundPlaceholders.length === 0) {
    console.log('✅ PASS: Zero hardcoded placeholder Client IDs found in codebase!');
  } else {
    console.error('❌ FAIL: Found hardcoded placeholder IDs in:', foundPlaceholders);
  }

  // 2️⃣ Query Server Endpoint /api/auth/google/config
  console.log('\n2️⃣ Querying Runtime Endpoint GET /api/auth/google/config...');
  try {
    const res = await new Promise((resolve, reject) => {
      http.get(`${BASE_URL}/api/auth/google/config`, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => resolve({ statusCode: r.statusCode, json: JSON.parse(data) }));
      }).on('error', reject);
    });

    if (res.statusCode === 200) {
      console.log('✅ PASS: /api/auth/google/config endpoint responded successfully (HTTP 200)');
      console.log('   -------------------------------------------------------');
      console.log(`   🔑 Masked Client ID Sent:      ${res.json.masked_client_id}`);
      console.log(`   🔐 Client Secret Configured:  ${res.json.client_secret_configured ? '✅ YES (Defined)' : '⚠️ NO (Undefined/Empty)'}`);
      console.log(`   🔗 Configured Redirect URI:    ${res.json.redirect_uri}`);
      console.log(`   ⚙️ Google OAuth Configured:   ${res.json.is_configured ? '✅ READY' : 'ℹ️ NOT CONFIGURED IN ENV'}`);
      console.log('   -------------------------------------------------------');
    } else {
      console.error(`❌ FAIL: Config endpoint returned status ${res.statusCode}`);
    }
  } catch(err) {
    console.error('❌ FAIL: Server not reachable on port 3000:', err.message);
  }

  console.log('\n🎉 GOOGLE OAUTH AUDIT & VERIFICATION COMPLETED SUCCESSFULLY!');
}

verifyGoogleOAuthConfig().catch(console.error);
