# PeekHour Setup Verification Script
# Run this to verify your Docker MySQL connection and setup

Write-Host "`n🔍 PeekHour Setup Verification`n" -ForegroundColor Cyan

# Check if Docker MySQL is running
Write-Host "1️⃣  Checking Docker MySQL container..." -ForegroundColor Yellow
$mysqlContainer = docker ps --filter "name=MYSQL" --format "{{.Names}}"
if ($mysqlContainer -eq "MYSQL") {
    Write-Host "   ✅ MySQL container is running" -ForegroundColor Green
} else {
    Write-Host "   ❌ MySQL container not found. Start it with: docker-compose up -d" -ForegroundColor Red
    exit 1
}

# Test MySQL connection
Write-Host "`n2️⃣  Testing MySQL connection..." -ForegroundColor Yellow
try {
    $testQuery = "SELECT 1"
    $result = docker exec MYSQL mysql -uadmin -padmin -e "$testQuery" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ MySQL connection successful" -ForegroundColor Green
    } else {
        Write-Host "   ❌ MySQL connection failed: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Error testing connection: $_" -ForegroundColor Red
    exit 1
}

# Check if database exists
Write-Host "`n3️⃣  Checking database..." -ForegroundColor Yellow
$dbCheck = docker exec MYSQL mysql -uadmin -padmin -e "SHOW DATABASES LIKE 'test'" 2>&1
if ($dbCheck -match "test") {
    Write-Host "   ✅ Database 'test' exists" -ForegroundColor Green
    
    # Check if tables exist
    $tableCount = docker exec MYSQL mysql -uadmin -padmin test -e "SHOW TABLES" 2>&1
    if ($tableCount -match "users") {
        Write-Host "   ✅ Tables are created" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Database exists but tables not found" -ForegroundColor Yellow
        Write-Host "   Run: Get-Content backend/database/schema.sql | docker exec -i MYSQL mysql -uadmin -padmin test" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ⚠️  Database 'test' not found" -ForegroundColor Yellow
    Write-Host "   Run: Get-Content backend/database/schema.sql | docker exec -i MYSQL mysql -uadmin -padmin test" -ForegroundColor Cyan
}

# Check backend dependencies
Write-Host "`n4️⃣  Checking backend dependencies..." -ForegroundColor Yellow
if (Test-Path "backend/node_modules") {
    Write-Host "   ✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Run: cd backend; npm install" -ForegroundColor Cyan
}

# Check frontend dependencies
Write-Host "`n5️⃣  Checking frontend dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Frontend dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Run: pnpm install" -ForegroundColor Cyan
}

# Check environment files
Write-Host "`n6️⃣  Checking environment files..." -ForegroundColor Yellow
if (Test-Path "backend/.env") {
    Write-Host "   ✅ Backend .env exists" -ForegroundColor Green
    # Verify credentials
    $envContent = Get-Content "backend/.env" -Raw
    if ($envContent -match "DB_USER=admin" -and $envContent -match "DB_PASSWORD=admin" -and $envContent -match "DB_NAME=test") {
        Write-Host "   ✅ MySQL credentials configured correctly" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  MySQL credentials may be incorrect" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Backend .env not found" -ForegroundColor Red
}

if (Test-Path ".env.local") {
    Write-Host "   ✅ Frontend .env.local exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Frontend .env.local not found" -ForegroundColor Red
}

# Check upload directories
Write-Host "`n7️⃣  Checking upload directories..." -ForegroundColor Yellow
if ((Test-Path "backend/uploads/media") -and (Test-Path "backend/uploads/faces")) {
    Write-Host "   ✅ Upload directories exist" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Upload directories missing" -ForegroundColor Yellow
    Write-Host "   Creating directories..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path "backend/uploads/media" -Force | Out-Null
    New-Item -ItemType Directory -Path "backend/uploads/faces" -Force | Out-Null
    Write-Host "   ✅ Upload directories created" -ForegroundColor Green
}

# Summary
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "📊 VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan

Write-Host "`n✅ All checks passed! You're ready to start the application." -ForegroundColor Green

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Initialize database (if not done):" -ForegroundColor White
Write-Host "      Get-Content backend/database/schema.sql | docker exec -i MYSQL mysql -uadmin -padmin test`n" -ForegroundColor Cyan
Write-Host "   2. Start Backend (Terminal 1):" -ForegroundColor White
Write-Host "      cd backend" -ForegroundColor Cyan
Write-Host "      npm install  # if not done" -ForegroundColor Gray
Write-Host "      npm run dev`n" -ForegroundColor Cyan
Write-Host "   3. Start Frontend (Terminal 2):" -ForegroundColor White
Write-Host "      pnpm install  # if not done" -ForegroundColor Gray
Write-Host "      pnpm dev`n" -ForegroundColor Cyan
Write-Host "   4. Visit http://localhost:3000`n" -ForegroundColor White

Write-Host "="*60 -ForegroundColor Cyan
