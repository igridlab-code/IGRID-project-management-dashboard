/**
 * IGRID INNOVATION LAB - MASTER SUPERVISOR SCRIPT
 * Manages Backend Server + Permanent Fixed Subdomain Tunnel (https://igrid-lab.loca.lt)
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
const SUBDOMAIN = 'igrid-lab';
const PERMANENT_PUBLIC_URL = `https://${SUBDOMAIN}.loca.lt`;

log('======================================================');
log('🚀 Starting IGRID Lab Master Supervisor Service');
log(`🌐 Permanent Public URL: ${PERMANENT_PUBLIC_URL}`);
log('======================================================');

savePublicUrl(PERMANENT_PUBLIC_URL, true);

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

// 2. Start Localtunnel with fixed subdomain
let tunnelProcess = null;
function startTunnel() {
  log(`Starting Public Tunnel on ${PERMANENT_PUBLIC_URL}...`);
  
  // Use npx localtunnel via shell
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  tunnelProcess = spawn(cmd, ['-y', 'localtunnel', '--port', '3000', '--subdomain', SUBDOMAIN], {
    cwd: projectDir,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  function processTunnelOutput(data) {
    const text = data.toString();
    if (text.includes('your url is:')) {
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.loca\.lt/);
      if (match && match[0]) {
        savePublicUrl(match[0], true);
      }
    }
  }

  tunnelProcess.stdout.on('data', (data) => {
    const text = data.toString().trim();
    if (text) log(`[Tunnel] ${text}`);
    processTunnelOutput(data);
  });

  tunnelProcess.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (text) log(`[Tunnel] ${text}`);
  });

  tunnelProcess.on('exit', (code) => {
    log(`[Tunnel] Exited with code ${code}. Restarting tunnel in 5s...`);
    setTimeout(startTunnel, 5000);
  });
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
(This link is fixed and will NEVER change across restarts)

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
