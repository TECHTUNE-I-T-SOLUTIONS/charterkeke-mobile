@echo off
REM Charter Keke Mobile App - Quick Setup Script (Windows)
REM Usage: setup.bat

echo.
echo 🚀 Charter Keke Mobile App - Setup Script
echo ===========================================
echo.

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed.
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm version: %NPM_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

REM Check for .env.local
if not exist .env.local (
    echo 🔧 Creating .env.local...
    copy .env.example .env.local
    echo ⚠️  Please edit .env.local with your API URL:
    echo    EXPO_PUBLIC_API_URL=http://your-backend-url:3000
) else (
    echo ✅ .env.local already exists
)

echo.
echo ✨ Setup complete!
echo.
echo Next steps:
echo 1. Edit .env.local if needed
echo 2. Run: npm start
echo 3. Scan QR code with Expo Go app
echo.
echo Happy coding! 🎉
echo.
pause
