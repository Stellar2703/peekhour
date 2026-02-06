#!/bin/bash

echo "🚀 PeekHour Setup Script"
echo "========================="
echo ""

# Check Node.js
echo "Checking Node.js installation..."
if command -v node &> /dev/null; then
    echo "✅ Node.js installed: $(node --version)"
else
    echo "❌ Node.js not found. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check MySQL
echo "Checking MySQL installation..."
if command -v mysql &> /dev/null; then
    echo "✅ MySQL installed: $(mysql --version)"
else
    echo "❌ MySQL not found. Please install MySQL"
    exit 1
fi

echo ""
echo "📦 Installing Backend Dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend installation failed"
    exit 1
fi
echo "✅ Backend dependencies installed"

echo ""
echo "📝 Setting up Backend Environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please edit backend/.env with your MySQL credentials"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "📁 Creating Upload Directories..."
mkdir -p uploads/media
mkdir -p uploads/faces
echo "✅ Upload directories created"

cd ..

echo ""
echo "📦 Installing Frontend Dependencies..."
if command -v pnpm &> /dev/null; then
    pnpm install
else
    echo "⚠️  pnpm not found, using npm..."
    npm install
fi
if [ $? -ne 0 ]; then
    echo "❌ Frontend installation failed"
    exit 1
fi
echo "✅ Frontend dependencies installed"

echo ""
echo "📝 Setting up Frontend Environment..."
if [ ! -f ".env.local" ]; then
    cp .env.local.example .env.local
    echo "✅ Created .env.local file"
else
    echo "ℹ️  .env.local file already exists"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next Steps:"
echo "1. Edit backend/.env with your MySQL credentials"
echo "2. Run MySQL setup:"
echo "   mysql -u root -p < backend/database/schema.sql"
echo "3. Start backend server:"
echo "   cd backend && npm run dev"
echo "4. In a new terminal, start frontend:"
echo "   pnpm dev"
echo ""
echo "📚 For more details, see README.md"
