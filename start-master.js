/**
 * IGRID INNOVATION LAB - MASTER SUPERVISOR SCRIPT
 * Manages Backend Server + Permanent Static Ngrok Tunnel
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

// Load config
let config = {
  tunnel_mode: 'ngrok',
  ngrok_domain: 'kabob-suspect-mandate.ngrok-free.dev',
  ngrok_token: '3Hr56NkQmK7fScedP090Ry6c8ll_78W6QjADbCB92cWhD8ZpT',
  custom_domain: 'https://kabob-suspect-mandate.ngrok-free.dev',
  port: 3000
};

if (fs.existsSync(configFile)) {
  try {
    const loaded = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    config = { ...config, ...loaded };
  } catch(e) {}
}

log('======================================================');
log('🚀 Starting IGRID Lab Master Supervisor Service');
log(`🌐 Permanent Public Domain: https://${config.ngrok_domain}`);
log('======================================================');

// Save permanent URL immediately
savePublicUrl(`https://${config.ngrok_domain}`, true);

// 1. Start Express Server
let serverProcess = null;
function startServer() {
  log('Starting Express backend server (server.js)...');
  serverProcess = spawn('node', ['server.js'], {
    cwd: projectDir,
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

// 2. Start Ngrok Tunnel Process
let tunnelProcess = null;
function startTunnel() {
  const ngrokExe = path.join(projectDir, 'ngrok.exe');
  if (!fs.existsSync(ngrokExe)) {
    log(`[Ngrok Error] ngrok.exe not found at ${ngrokExe}`);
    return;
  }

  log(`Starting Ngrok on permanent domain: https://${config.ngrok_domain}...`);
  
  // Use modern ngrok --url syntax
  tunnelProcess = spawn(ngrokExe, ['http', `--url=https://${config.ngrok_domain}`, '3000'], {
    cwd: projectDir,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  tunnelProcess.stdout.on('data', (data) => {
    const text = data.toString().trim();
    if (text) log(`[Ngrok] ${text}`);
  });
  tunnelProcess.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (text) log(`[Ngrok] ${text}`);
  });

  tunnelProcess.on('exit', (code) => {
    log(`[Ngrok] Exited with code ${code}. Restarting in 5s...`);
    setTimeout(startTunnel, 5000);
  });
}

function savePublicUrl(publicUrl, isPermanent) {
  log('------------------------------------------------------');
  log(`🎉 LIVE PUBLIC URL (${isPermanent ? 'PERMANENT FIXED DOMAIN' : 'QUICK TUNNEL'}): ${publicUrl}`);
  log('------------------------------------------------------');

  const content = `================================================================================
IGRID INNOVATION LAB - LIVE PUBLIC ACCESS LINKS
================================================================================

🌐 PERMANENT PUBLIC WORLDWIDE LINK (HTTPS):
${publicUrl}
(This link is fixed forever and will NEVER change)

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

// Start Server then Tunnel
startServer();
setTimeout(startTunnel, 2000);

process.on('SIGINT', () => {
  if (serverProcess) serverProcess.kill();
  if (tunnelProcess) tunnelProcess.kill();
  process.exit(0);
});
process.on('SIGTERM', () => {
  if (serverProcess) serverProcess.kill();
  if (tunnelProcess) tunnelProcess.kill();
  process.exit(0);
});
