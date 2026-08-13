@echo off
title IGRID Lab Dashboard - Configure Permanent Fixed Public URL
color 0A
cls
echo ======================================================================
echo           IGRID LAB - CONFIGURE PERMANENT FIXED PUBLIC URL
echo ======================================================================
echo.
echo  To get a PERMANENT URL that NEVER changes across restarts, you can:
echo.
echo  1. Create a FREE Cloudflare Tunnel:
echo     a. Go to: https://one.dash.cloudflare.com
echo     b. Click: Networks -> Tunnels -> Create a Tunnel (choose cloudflared)
echo     c. Name it "igrid-lab" and copy the Token string (after --token)
echo     d. In Public Hostname, set your domain (e.g. igrid.yourdomain.com)
echo.
echo ======================================================================
echo.

set /p TOKEN="Paste your Cloudflare Tunnel Token (or press Enter to keep Quick Tunnel): "
set /p DOMAIN="Enter your Permanent Domain (e.g. igrid.yourdomain.com): "

if not "%TOKEN%"=="" (
    node -e "
    const fs = require('fs');
    const cfg = {
        tunnel_mode: 'named_tunnel',
        cloudflare_token: '%TOKEN%'.trim(),
        custom_domain: '%DOMAIN%'.trim(),
        port: 3000
    };
    fs.writeFileSync('config.json', JSON.stringify(cfg, null, 2));
    console.log('Saved permanent tunnel configuration to config.json!');
    "
    echo.
    echo ======================================================================
    echo  SUCCESS! Permanent Tunnel Configured!
    echo  Your dashboard will now permanently run on: https://%DOMAIN%
    echo ======================================================================
) else (
    echo No token entered. Keeping default quick tunnel.
)

echo.
pause
