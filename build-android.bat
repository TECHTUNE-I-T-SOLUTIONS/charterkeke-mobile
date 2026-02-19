@echo off
setlocal

REM Set Android SDK path
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk

REM Set Java path
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM Change to project directory
cd /d "%~dp0"

REM Run the build
echo Building Android app with Mapbox SDK...
pnpm expo run:android

pause
