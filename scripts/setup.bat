@echo off
setlocal enabledelayedexpansion

for %%I in ("%~dp0..") do set "PROJECT_DIR=%%~fI"
cd /d "%PROJECT_DIR%"

echo ================================
echo ZombieCursor Quick Setup
echo ================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js not found. Please install from https://nodejs.org/
    pause
    exit /b 1
)

echo Installing extension dependencies...
cd /d "%PROJECT_DIR%\extension"
call npm install

echo.
echo Compiling TypeScript...
call npm run compile

echo.
echo Creating VSIX package...
call npm run package

for /f %%f in ('dir /b zombie-ai-assistant-*.vsix 2^>nul') do set VSIX_FILE=%%f

if defined VSIX_FILE (
    echo.
    echo Success! VSIX file created: !VSIX_FILE!
    echo.
    echo Next steps:
    echo 1. Install the extension:
    echo    code --install-extension !VSIX_FILE!
    echo.
    echo 2. Configure API key in VS Code Settings
    echo 3. Start chatting!
    echo.
) else (
    echo Error: Failed to create VSIX file
    exit /b 1
)

pause
endlocal
