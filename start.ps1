# AI Toy Builder – Windows Quick-Start Script
# Run this once to set everything up and start all servers.
# Usage: .\start.ps1

Write-Host "`n🎯 AI Toy Builder – Setup & Start" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Install root npm deps
Write-Host "`n[1/5] Installing root npm deps..." -ForegroundColor Yellow
npm install --prefix $root

# 2. Install backend npm deps
Write-Host "`n[2/5] Installing backend npm deps..." -ForegroundColor Yellow
npm install --prefix "$root\backend"

# 3. Install frontend npm deps (already done by vite scaffold, just in case)
Write-Host "`n[3/5] Verifying frontend npm deps..." -ForegroundColor Yellow
npm install --prefix "$root\frontend"

# 4. Python AI server deps
Write-Host "`n[4/5] Installing Python AI server deps..." -ForegroundColor Yellow
python -m pip install -r "$root\ai_server\requirements.txt" --quiet

# 5. Start all servers concurrently
Write-Host "`n[5/5] Starting all servers..." -ForegroundColor Green
Write-Host "  🟢 Backend  → http://localhost:5000" -ForegroundColor Green
Write-Host "  🟢 AI Server→ http://localhost:8000" -ForegroundColor Green
Write-Host "  🟢 Frontend → http://localhost:3000" -ForegroundColor Green
Write-Host ""

# Open 3 terminal windows
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\ai_server'; python main.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "✅ All servers launched in separate windows!" -ForegroundColor Cyan
Write-Host "   Open http://localhost:3000 in your browser." -ForegroundColor White
