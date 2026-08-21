/**
 * IGRID INNOVATION LAB - MASTER SUPERVISOR SCRIPT
 * Uses official @ngrok/ngrok SDK for permanent domain https://kabob-suspect-mandate.ngrok-free.dev
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = __dirname;
const logsDir = path.join(projectDir, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const serviceLog = path.join(logsDir, 'service.log');
const publicLinkFile = path.join(projectDir, 'PUBLIC_ACCESS_LINK.txt');
const tunnelJsonFile = path.join(projectDir, 'public', 'tunnel_info.json');
const configFile = path.join(projectDir, 'config.json');

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(serviceLog, line + '\n');
  } catch(e) {}
}

// 0. Auto-clean port 3000 conflicts before starting
try {
  if (process.platform === 'win32') {
    execSync('powershell -Command "$p = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue; if ($p) { $p | ForEach-Object { if ($_.OwningProcess -ne $PID -and $_.OwningProcess -gt 0) { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } } }"', { stdio: 'ignore' });
  }
} catch(e) {}

// Configuration
let config = {
  ngrok_domain: 'kabob-suspect-mandate.ngrok-free.dev',
  ngrok_token: '3Hr56NkQmK7fScedP090Ry6c8ll_78W6QjADbCB92cWhD8ZpT',
  port: 3000
};

if (fs.existsSync(configFile)) {
  try {
    const loaded = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    config = { ...config, ...loaded };
  } catch(e) {}
}

const PERMANENT_PUBLIC_URL = `https://${config.ngrok_domain}`;

log('======================================================');
log('🚀 Starting IGRID Lab Master Supervisor Service');
log(`🌐 Permanent Public Domain: ${PERMANENT_PUBLIC_URL}`);
log('======================================================');

savePublicUrl(PERMANENT_PUBLIC_URL, true);

// 1. Start Express Server
let serverProcess = null;
function startServer() {
  log('Starting Express backend server (server.js)...');
  const env = { ...process.env };
  if (config.anthropic_api_key) {
    env.ANTHROPIC_API_KEY = config.anthropic_api_key;
  }
  serverProcess = spawn('node', ['server.js'], {
    cwd: projectDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProcess.stdout.on('data', (data) => {
    const text = data.toString().trim();
    if (text) log(`[Server] ${text}`);
  });

  serverProcess.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (text) log(`[Server Error] ${text}`);
  });

  serverProcess.on('exit', (code) => {
    log(`[Server] Exited with code ${code}. Restarting in 3s...`);
    setTimeout(startServer, 3000);
  });
}

// 2. Start Ngrok via official SDK
let ngrokListener = null;
async function startNgrokSdk() {
  try {
    const ngrok = require('@ngrok/ngrok');
    log(`Connecting to Ngrok cloud for domain ${config.ngrok_domain}...`);
    
    ngrokListener = await ngrok.connect({
      addr: config.port || 3000,
      authtoken: config.ngrok_token,
      domain: config.ngrok_domain
    });

    const liveUrl = ngrokListener.url();
    log(`🎉 NGROK CONNECTED SUCCESSFULLY! Live URL: ${liveUrl}`);
    savePublicUrl(liveUrl, true);
  } catch (err) {
    log(`[Ngrok Error] ${err.message || err}`);
    if (err.message && err.message.includes('already online')) {
      log('Ngrok endpoint is already online and routing traffic.');
      savePublicUrl(PERMANENT_PUBLIC_URL, true);
    }
  }
}

function savePublicUrl(publicUrl, isPermanent) {
  log('------------------------------------------------------');
  log(`🎉 LIVE PUBLIC URL (${isPermanent ? 'PERMANENT FIXED DOMAIN' : 'TUNNEL'}): ${publicUrl}`);
  log('------------------------------------------------------');

  const content = `================================================================================
IGRID INNOVATION LAB - LIVE PUBLIC ACCESS LINKS
================================================================================

🌐 PERMANENT PUBLIC WORLDWIDE LINK (HTTPS):
${publicUrl}
(This link is fixed and will NEVER change)

💻 LOCAL COMPUTER LINK:
http://localhost:3000

📡 LOCAL WI-FI / LAB NETWORK LINK:
http://192.168.0.164:3000

Status: Active & Synchronized
Updated: ${new Date().toLocaleString()}
================================================================================
`;
  fs.writeFileSync(publicLinkFile, content, 'utf8');

  const tunnelInfo = {
    public_url: publicUrl,
    is_permanent: isPermanent,
    local_url: 'http://localhost:3000',
    lan_url: 'http://192.168.0.164:3000',
    updated_at: new Date().toISOString()
  };
  fs.writeFileSync(tunnelJsonFile, JSON.stringify(tunnelInfo, null, 2), 'utf8');
}

// Start Server and Ngrok
startServer();
setTimeout(startNgrokSdk, 2000);

process.on('SIGINT', async () => {
  if (serverProcess) serverProcess.kill();
  if (ngrokListener) {
    try {
      const ngrok = require('@ngrok/ngrok');
      await ngrok.disconnect();
    } catch(e) {}
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (serverProcess) serverProcess.kill();
  if (ngrokListener) {
    try {
      const ngrok = require('@ngrok/ngrok');
      await ngrok.disconnect();
    } catch(e) {}
  }
  process.exit(0);
});
