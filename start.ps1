# PeekHour Quick Start Script
# Run this to start both backend and frontend

Write-Host "`n🚀 Starting PeekHour Application...`n" -ForegroundColor Cyan

# Check if Docker MySQL is running
$mysqlRunning = docker ps --filter "name=MYSQL" --format "{{.Names}}" 2>$null
if ($mysqlRunning -ne "MYSQL") {
    Write-Host "❌ MySQL container not running!" -ForegroundColor Red
    Write-Host "   Start it with: docker-compose up -d`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ MySQL container is running" -ForegroundColor Green

# Start backend in new terminal
Write-Host "`n📦 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '🔧 Backend Server Starting...' -ForegroundColor Cyan; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend in new terminal
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host '⚛️  Frontend Server Starting...' -ForegroundColor Cyan; npm run dev"

Write-Host "`n✅ Both servers starting in separate terminals" -ForegroundColor Green
Write-Host "`n📱 Application will be available at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000`n" -ForegroundColor White

Write-Host "💡 Tip: Wait ~10 seconds for servers to fully start`n" -ForegroundColor Yellow
