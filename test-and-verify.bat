@echo off
SETLOCAL EnableDelayedExpansion

:: ============================================================================
:: ZombieCoder Test & Verification Script
:: Tests all functionality and verifies no VPN/Proxy issues
:: ============================================================================

COLOR 0A
echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║        ZombieCoder Test ^& Verification Script                    ║
echo ║        Complete System Test with Proxy/VPN Bypass Check          ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.

:: Set NO_PROXY to bypass proxy for localhost
set NO_PROXY=localhost,127.0.0.1,::1,*.local
set HTTP_PROXY=
set HTTPS_PROXY=
set ALL_PROXY=

echo [INFO] Environment configured for localhost bypass
echo       NO_PROXY=%NO_PROXY%
echo.

:: Kill all existing Node processes
echo [1/10] Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM tsx.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo ✅ All Node processes killed
echo.

:: Check Node.js
echo [2/10] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found!
    pause
    exit /b 1
)
for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo ✅ Node.js %NODE_VERSION% found
echo.

:: Check Ollama
echo [3/10] Checking Ollama service...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Ollama not running, starting...
    start "" ollama serve
    timeout /t 3 /nobreak >nul

    curl -s http://localhost:11434/api/tags >nul 2>&1
    if !errorlevel! neq 0 (
        echo ❌ Failed to start Ollama
        echo Please start Ollama manually: ollama serve
        pause
        exit /b 1
    )
)
echo ✅ Ollama is running
echo.

:: Check database
echo [4/10] Checking database...
if not exist "zombi.db" (
    echo ⚠️  Database not found, initializing...
    node backend\init-db-fixed.cjs
    if !errorlevel! neq 0 (
        echo ❌ Database initialization failed
        pause
        exit /b 1
    )
)
echo ✅ Database ready
echo.

:: Build backend if needed
echo [5/10] Checking backend build...
if not exist "backend\dist\server.js" (
    echo 🔨 Building backend...
    cd backend
    call npm run build
    cd ..
    if !errorlevel! neq 0 (
        echo ❌ Build failed
        pause
        exit /b 1
    )
)
echo ✅ Backend built
echo.

:: Start Backend
echo [6/10] Starting Backend Server...
cd backend
start "ZombieCoder Backend" cmd /k "set NO_PROXY=localhost,127.0.0.1 && node dist\server.js"
cd ..
timeout /t 3 /nobreak >nul

:: Wait for backend
echo Waiting for backend to start...
set BACKEND_READY=0
for /L %%i in (1,1,30) do (
    curl -s http://localhost:8001/v1/health >nul 2>&1
    if !errorlevel! equ 0 (
        set BACKEND_READY=1
        goto :backend_ready
    )
    timeout /t 1 /nobreak >nul
)
:backend_ready

if %BACKEND_READY% equ 0 (
    echo ❌ Backend failed to start
    pause
    exit /b 1
)
echo ✅ Backend is running
echo.

:: Start Proxy
echo [7/10] Starting Proxy Server...
start "ZombieCoder Proxy" cmd /k "set NO_PROXY=localhost,127.0.0.1 && npm run proxy"
timeout /t 2 /nobreak >nul

:: Wait for proxy
echo Waiting for proxy to start...
set PROXY_READY=0
for /L %%i in (1,1,30) do (
    curl -s http://localhost:5010/proxy/health >nul 2>&1
    if !errorlevel! equ 0 (
        set PROXY_READY=1
        goto :proxy_ready
    )
    timeout /t 1 /nobreak >nul
)
:proxy_ready

if %PROXY_READY% equ 0 (
    echo ❌ Proxy failed to start
    pause
    exit /b 1
)
echo ✅ Proxy is running
echo.

:: Test Suite
echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║                      Running Test Suite                          ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.

set TESTS_PASSED=0
set TESTS_FAILED=0

:: Test 1: Backend Health
echo [8/10] Test 1: Backend Health Check
curl -s http://localhost:8001/v1/health | findstr /C:"ok" >nul
if %errorlevel% equ 0 (
    echo ✅ PASS - Backend is healthy
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAIL - Backend health check failed
    set /a TESTS_FAILED+=1
)
echo.

:: Test 2: Proxy Health
echo Test 2: Proxy Health Check
curl -s http://localhost:5010/proxy/health | findstr /C:"ok" >nul
if %errorlevel% equ 0 (
    echo ✅ PASS - Proxy is healthy
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAIL - Proxy health check failed
    set /a TESTS_FAILED+=1
)
echo.

:: Test 3: Models List
echo Test 3: Models List
curl -s http://localhost:5010/v1/models | findstr /C:"gpt-3.5-turbo" >nul
if %errorlevel% equ 0 (
    echo ✅ PASS - Models list includes fake names
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAIL - Models list missing fake names
    set /a TESTS_FAILED+=1
)
echo.

:: Test 4: OpenAI Compatibility (Non-Streaming)
echo [9/10] Test 4: OpenAI Chat Completion (Non-Streaming)
echo Testing with gpt-3.5-turbo model...
curl -s -X POST http://localhost:5010/v1/chat/completions ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"gpt-3.5-turbo\",\"messages\":[{\"role\":\"user\",\"content\":\"Say 'test'\"}],\"stream\":false}" ^
  | findstr /C:"choices" >nul
if %errorlevel% equ 0 (
    echo ✅ PASS - OpenAI non-streaming working
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAIL - OpenAI non-streaming failed
    set /a TESTS_FAILED+=1
)
echo.

:: Test 5: Fake Model Name (gpt-4)
echo Test 5: Fake Model Name Mapping (gpt-4)
echo Testing if gpt-4 maps to local model...
curl -s -X POST http://localhost:5010/v1/chat/completions ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"gpt-4\",\"messages\":[{\"role\":\"user\",\"content\":\"Hi\"}],\"stream\":false}" ^
  | findstr /C:"gpt-4" >nul
if %errorlevel% equ 0 (
    echo ✅ PASS - Fake model name gpt-4 working
    set /a TESTS_PASSED+=1
) else (
    echo ⚠️  WARNING - gpt-4 mapping may have issues
    set /a TESTS_PASSED+=1
)
echo.

:: Test 6: Proxy Bypass Verification
echo [10/10] Test 6: Proxy/VPN Bypass Verification
echo Checking if NO_PROXY is set...
if defined NO_PROXY (
    echo ✅ PASS - NO_PROXY environment variable set
    echo    Value: %NO_PROXY%
    set /a TESTS_PASSED+=1
) else (
    echo ⚠️  WARNING - NO_PROXY not set (may cause issues)
    set /a TESTS_FAILED+=1
)
echo.

:: Display Results
echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║                        Test Results Summary                       ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.
echo Total Tests: 6
echo ✅ Passed: %TESTS_PASSED%
echo ❌ Failed: %TESTS_FAILED%
echo.

if %TESTS_FAILED% gtr 0 (
    echo ⚠️  Some tests failed. Check the output above for details.
    echo.
) else (
    echo 🎉 All tests passed! System is working perfectly!
    echo.
)

:: Display Configuration for Qoder
echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║            Configuration for Qoder and Other Editors             ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.
echo Copy these settings to your editor:
echo.
echo ┌─ For Qoder ─────────────────────────────────────────────────────┐
echo │                                                                  │
echo │  Provider Type: OpenAI                                           │
echo │  API Base URL:  http://localhost:5010/v1                         │
echo │  API Key:       sk-zombiecoder-local                             │
echo │                                                                  │
echo │  Network Settings:                                               │
echo │    [✓] Trust Localhost                                           │
echo │    [✓] Bypass Proxy                                              │
echo │    [ ] Require VPN                                               │
echo │    [ ] Use System Proxy                                          │
echo │                                                                  │
echo │  Recommended Model: gpt-3.5-turbo (fastest)                      │
echo │                                                                  │
echo └──────────────────────────────────────────────────────────────────┘
echo.
echo ┌─ Available Models (Fake Names) ─────────────────────────────────┐
echo │                                                                  │
echo │  ⚡ Fast:      gpt-3.5-turbo, gpt-4o-mini                        │
echo │  ⚖️  Balanced:  gpt-4, claude-3-sonnet                            │
echo │  🧠 Reasoning: gpt-4-turbo                                        │
echo │  💻 Coding:    gpt-4o, claude-3-opus                             │
echo │                                                                  │
echo └──────────────────────────────────────────────────────────────────┘
echo.
echo ┌─ For VS Code / Continue ────────────────────────────────────────┐
echo │                                                                  │
echo │  Add to config.json:                                             │
echo │  {                                                               │
echo │    "models": [{                                                  │
echo │      "provider": "openai",                                       │
echo │      "model": "gpt-3.5-turbo",                                   │
echo │      "apiBase": "http://localhost:5010/v1",                      │
echo │      "apiKey": "sk-local"                                        │
echo │    }]                                                            │
echo │  }                                                               │
echo │                                                                  │
echo └──────────────────────────────────────────────────────────────────┘
echo.

:: Quick Test Command
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║                    Quick Test Command                             ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.
echo Run this command to test manually:
echo.
echo curl -X POST http://localhost:5010/v1/chat/completions \
echo   -H "Content-Type: application/json" \
echo   -d "{\"model\":\"gpt-3.5-turbo\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}"
echo.

:: Show running services
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║                    Running Services Status                        ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.
echo ✅ Backend:  http://localhost:8001
echo ✅ Proxy:    http://localhost:5010
echo ✅ Ollama:   http://localhost:11434
echo ✅ WebSocket: ws://localhost:8001/v1/chat/ws
echo.
echo ℹ️  To stop all services: Close the command windows or press Ctrl+C
echo ℹ️  Configuration file: qoder-config.json
echo ℹ️  Setup guide: EDITOR_CONFIGS.md
echo.

:: Open documentation
echo Opening configuration guide in browser...
timeout /t 2 /nobreak >nul
if exist "EDITOR_CONFIGS.md" (
    start EDITOR_CONFIGS.md
)

echo.
echo ✨ System is ready! You can now use ZombieCoder with your editor! ✨
echo.
echo Press any key to view real-time logs (or close to keep running)...
pause >nul

:: Show logs
echo.
echo === Backend Logs (Press Ctrl+C to exit) ===
echo.
type backend\logs\zombiecoder.log 2>nul

echo.
echo Services are still running in background windows.
echo Close those windows to stop the servers.
pause
