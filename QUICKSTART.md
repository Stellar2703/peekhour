# PeekHour Quick Start Guide

## 🎯 Quick Setup (5 minutes)

### Step 1: Setup Database
```bash
# Start MySQL (if not running)
# Windows: net start MySQL80
# macOS: brew services start mysql
# Linux: sudo systemctl start mysql

# Login to MySQL
mysql -u root -p

# Create database and tables
source backend/database/schema.sql
```

### Step 2: Configure Backend
```bash
# Navigate to backend
cd backend

# Copy environment file
cp .env.example .env

# Edit .env - Set your MySQL password
# Required: DB_PASSWORD=your_mysql_password
```

### Step 3: Install & Run

#### Option A: Automated (Recommended)
```powershell
# Windows PowerShell
.\setup.ps1
```

```bash
# macOS/Linux
chmod +x setup.sh
./setup.sh
```

#### Option B: Manual
```bash
# Install backend
cd backend
npm install
npm run dev

# In new terminal - Install frontend
cd ..
pnpm install
pnpm dev
```

### Step 4: Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

## 🧪 First Test

1. **Register**: Go to /signup
   - Fill form
   - Capture face photo
   - Submit

2. **Create Post**: On /home
   - Add text/media
   - Set location
   - Post!

3. **Interact**: 
   - Like posts (⚡)
   - Comment (💬)
   - Share (📤)

## ❓ Common Issues

### Can't connect to database
```bash
# Check MySQL is running
# Windows: sc query MySQL80
# macOS: brew services list
# Linux: systemctl status mysql
```

### Port already in use
```bash
# Backend (port 5000)
# Change PORT in backend/.env

# Frontend (port 3000)
# Next.js will auto-select next available port
```

### Upload not working
```bash
# Check directories exist
mkdir -p backend/uploads/media
mkdir -p backend/uploads/faces
```

## 📚 Full Documentation

See [README.md](README.md) for complete documentation.

## 🔑 Default Settings

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- Database: `peekhour_db`
- Max Upload: 10MB
- Token Expiry: 7 days

---

Need help? Check the troubleshooting section in README.md
