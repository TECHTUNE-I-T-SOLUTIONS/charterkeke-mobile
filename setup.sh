#!/bin/bash

# Charter Keke Mobile App - Quick Setup Script
# Usage: chmod +x setup.sh && ./setup.sh

echo "🚀 Charter Keke Mobile App - Setup Script"
echo "==========================================="
echo ""

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Check for .env.local
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your API URL:"
    echo "   EXPO_PUBLIC_API_URL=http://your-backend-url:3000"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local if needed"
echo "2. Run: npm start"
echo "3. Scan QR code with Expo Go app"
echo ""
echo "Happy coding! 🎉"
