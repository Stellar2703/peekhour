# PeekHour Setup Script for Windows PowerShell

Write-Host "🚀 PeekHour Setup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check MySQL
Write-Host "Checking MySQL installation..." -ForegroundColor Yellow
try {
    $mysqlVersion = mysql --version
    Write-Host "✅ MySQL installed: $mysqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ MySQL not found. Please install MySQL from https://dev.mysql.com/downloads/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "📝 Setting up Backend Environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from .env.example" -ForegroundColor Green
    Write-Host "⚠️  Please edit backend/.env with your MySQL credentials" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  .env file already exists" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📁 Creating Upload Directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "uploads/media" | Out-Null
New-Item -ItemType Directory -Force -Path "uploads/faces" | Out-Null
Write-Host "✅ Upload directories created" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "📦 Installing Frontend Dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  pnpm not found, trying npm..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend installation failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "📝 Setting up Frontend Environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "✅ Created .env.local file" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env.local file already exists" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit backend/.env with your MySQL credentials" -ForegroundColor White
Write-Host "2. Run MySQL setup:" -ForegroundColor White
Write-Host "   mysql -u root -p < backend/database/schema.sql" -ForegroundColor Gray
Write-Host "3. Start backend server:" -ForegroundColor White
Write-Host "   cd backend && npm run dev" -ForegroundColor Gray
Write-Host "4. In a new terminal, start frontend:" -ForegroundColor White
Write-Host "   pnpm dev" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 For more details, see README.md" -ForegroundColor Cyan
