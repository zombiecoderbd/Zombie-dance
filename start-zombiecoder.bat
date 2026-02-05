@echo off
SETLOCAL EnableDelayedExpansion

:: ============================================================================
:: ZombieCoder AI Assistant - Complete Setup and Start Script
:: Version: 2.0.0
:: Description: আমি ZombieCoder, যেখানে কোড ও কথা বলে।
:: ============================================================================

COLOR 0A
echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║        ZombieCoder AI Assistant - Complete Setup                  ║
echo ║        Version 2.0.0 - Bengali AI Code Assistant                  ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.

:: Check if Node.js is installed
echo [1/8] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js is installed

:: Check if Ollama is running
echo.
echo [2/8] Checking Ollama service...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Ollama is not running!
    echo Starting Ollama service...
    start "" "ollama" serve
    timeout /t 3 /nobreak >nul

    curl -s http://localhost:11434/api/tags >nul 2>&1
    if !errorlevel! neq 0 (
        echo ❌ Failed to start Ollama
        echo Please start Ollama manually
        pause
        exit /b 1
    )
)
echo ✅ Ollama is running

:: Check if default model exists
echo.
echo [3/8] Checking default model (qwen2.5-coder:0.5b)...
curl -s http://localhost:11434/api/tags | findstr /C:"qwen2.5-coder:0.5b" >nul
if %errorlevel% neq 0 (
    echo ⚠️  Default model not found
    echo Pulling qwen2.5-coder:0.5b (this may take a few minutes)...
    ollama pull qwen2.5-coder:0.5b
    if !errorlevel! neq 0 (
        echo ❌ Failed to pull model
        echo Continuing anyway - you may need to pull models manually
    ) else (
        echo ✅ Model pulled successfully
    )
) else (
    echo ✅ Default model is available
)

:: Initialize database if needed
echo.
echo [4/8] Checking database...
if not exist "zombi.db" (
    echo 📊 Database not found, initializing...
    node backend\init-db-fixed.cjs
    if !errorlevel! neq 0 (
        echo ❌ Database initialization failed
        pause
        exit /b 1
    )
    echo ✅ Database initialized
) else (
    echo ✅ Database exists
)

:: Build backend if needed
echo.
echo [5/8] Building backend...
if not exist "backend\dist" (
    echo 🔨 Building backend for the first time...
    cd backend
    call npm run build
    cd ..
    if !errorlevel! neq 0 (
        echo ❌ Build failed
        pause
        exit /b 1
    )
) else (
    echo ✅ Backend already built (run 'npm run build' in backend folder to rebuild)
)

:: Kill any existing processes on our ports
echo.
echo [6/8] Checking for running services...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001') do (
    echo Killing process on port 8001...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5010') do (
    echo Killing process on port 5010...
    taskkill /F /PID %%a >nul 2>&1
)
echo ✅ Ports are clear

:: Start Backend Server
echo.
echo [7/8] Starting Backend Server (Port 8001)...
cd backend
start "ZombieCoder Backend" cmd /k "echo Backend Server Running && node dist\server.js"
cd ..
timeout /t 3 /nobreak >nul

:: Wait for backend to be ready
echo Waiting for backend to start...
:WAIT_BACKEND
timeout /t 1 /nobreak >nul
curl -s http://localhost:8001/v1/health >nul 2>&1
if %errorlevel% neq 0 goto WAIT_BACKEND
echo ✅ Backend server is running

:: Start Proxy Server
echo.
echo [8/8] Starting Proxy Server (Port 5010)...
start "ZombieCoder Proxy" cmd /k "echo Proxy Server Running && npm run proxy"
timeout /t 2 /nobreak >nul

:: Wait for proxy to be ready
echo Waiting for proxy to start...
:WAIT_PROXY
timeout /t 1 /nobreak >nul
curl -s http://localhost:5010/proxy/health >nul 2>&1
if %errorlevel% neq 0 goto WAIT_PROXY
echo ✅ Proxy server is running

:: Display status
echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║                    🎉 All Services Started! 🎉                    ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.
echo 📊 Service Status:
echo    ✅ Ollama:         http://localhost:11434
echo    ✅ Backend:        http://localhost:8001
echo    ✅ Proxy:          http://localhost:5010
echo    ✅ WebSocket:      ws://localhost:8001/v1/chat/ws
echo.
echo 🔗 Available Endpoints:
echo    • Health Check:    http://localhost:8001/v1/health
echo    • OpenAI API:      http://localhost:5010/v1/chat/completions
echo    • Models List:     http://localhost:8001/api/models
echo    • Chat (Direct):   http://localhost:8001/v1/chat
echo.
echo 🤖 Available Models (Fake Names - OpenAI Compatible):
echo    • gpt-4            → qwen2.5-coder:1.5b
echo    • gpt-4-turbo      → deepseek-r1:1.5b
echo    • gpt-3.5-turbo    → qwen2.5-coder:0.5b (Default - Fastest)
echo    • gpt-4o           → qwen2.5-coder:1.5b
echo    • gpt-4o-mini      → qwen2.5-coder:0.5b
echo    • claude-3-opus    → deepseek-coder:1.3b
echo    • claude-3-sonnet  → qwen2.5-coder:1.5b
echo    • claude-3-haiku   → qwen2.5-coder:0.5b
echo.
echo 📝 Quick Test:
echo    curl -X POST http://localhost:5010/v1/chat/completions ^
echo      -H "Content-Type: application/json" ^
echo      -d "{\"model\":\"gpt-3.5-turbo\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}"
echo.
echo 🛠️  Configuration:
echo    • Config File:     zombiecoder-config.json
echo    • Database:        zombi.db
echo    • Logs:            backend/logs/
echo.
echo 📚 Documentation:
echo    • Complete Fix:    COMPLETE_FIX_SUMMARY.md
echo    • Bengali Guide:   FINAL_SUMMARY_BN.md
echo    • Test Results:    PROXY_OPENAI_TEST_RESULTS.md
echo.
echo ⚠️  To stop all services:
echo    • Close this window or press Ctrl+C
echo    • Run: taskkill /F /IM node.exe
echo.
echo 💡 Tips:
echo    • Use gpt-3.5-turbo for fastest responses
echo    • Use gpt-4 for better quality
echo    • All OpenAI/Anthropic model names work!
echo    • Check zombiecoder-config.json for full model mapping
echo.
echo ✨ Ready to code with ZombieCoder! ✨
echo.

:: Open browser to health check
timeout /t 2 /nobreak >nul
start http://localhost:8001/v1/health

echo Press any key to view logs (or close to keep running in background)...
pause >nul

:: Show backend logs
type backend\logs\zombiecoder.log 2>nul

echo.
echo Press any key to exit (servers will keep running)...
pause >nul
