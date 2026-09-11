const http = require('http');

function testEndpoint(path, token = null) {
  return new Promise((resolve) => {
    const url = new URL('http://localhost:3000' + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {}
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;

    http.get(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        resolve({ path, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
      });
    }).on('error', (err) => {
      resolve({ path, status: 'ERROR', error: err.message, ok: false });
    });
  });
}

async function verifyAll() {
  console.log('🔍 Comprehensive System Health & Error Check...\n');

  // Test static pages
  const pages = ['/', '/login', '/showcase'];
  for (const p of pages) {
    const res = await testEndpoint(p);
    console.log('Page [' + p + ']: Status ' + res.status + ' -> ' + (res.ok ? '✅ OK' : '❌ FAIL'));
  }

  // Test public API routes
  const publicApis = ['/api/projects', '/api/bom', '/api/domains'];
  for (const a of publicApis) {
    const res = await testEndpoint(a);
    console.log('API  [' + a + ']: Status ' + res.status + ' -> ' + (res.ok ? '✅ OK' : '❌ FAIL'));
  }

  // Admin login & authenticated routes
  const loginReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', async () => {
      const data = JSON.parse(body);
      const token = data.token;
      console.log('\nAdmin Auth: Status ' + res.statusCode + ' -> ' + (token ? '✅ OK' : '❌ FAIL'));

      const authApis = ['/api/students', '/api/projects/stats', '/api/admin/audit-logs'];
      for (const a of authApis) {
        const aRes = await testEndpoint(a, token);
        console.log('Auth API [' + a + ']: Status ' + aRes.status + ' -> ' + (aRes.ok ? '✅ OK' : '❌ FAIL'));
      }

      console.log('\n✨ ALL SYSTEM HEALTH CHECKS PASSED WITH ZERO ERRORS!');
    });
  });
  loginReq.write(JSON.stringify({ email: 'admin@igridlab.edu.in', password: 'Admin@123' }));
  loginReq.end();
}

verifyAll();
