@echo off
setlocal enabledelayedexpansion

REM Get the project directory
for %%I in ("%~dp0..") do set "PROJECT_DIR=%%~fI"
cd /d "%PROJECT_DIR%"

echo ================================
echo Building ZombieCursor Extension
echo ================================
echo.

REM Check for prerequisites
echo Checking prerequisites...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js not found. Please install Node.js from https://nodejs.org/
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm not found. Please reinstall Node.js.
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo Node.js !NODE_VERSION! detected
echo npm !NPM_VERSION! detected
echo.

echo Step 1: Installing extension dependencies...
cd /d "%PROJECT_DIR%\extension"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install dependencies
    exit /b 1
)
echo Dependencies installed successfully
echo.

echo Step 2: Running TypeScript compiler...
call npm run compile
if %ERRORLEVEL% NEQ 0 (
    echo Error: TypeScript compilation failed
    exit /b 1
)
echo TypeScript compiled successfully
echo.

echo Step 3: Running linter...
call npm run lint
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Lint found issues but continuing...
)
echo.

echo Step 4: Running tests...
call npm test
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Tests failed but continuing...
)
echo.

echo Step 5: Creating VSIX package...
del /q zombie-ai-assistant-*.vsix 2>nul
call npm run package
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to create VSIX package
    exit /b 1
)
echo VSIX package created successfully
echo.

REM Find the VSIX file
for /f %%f in ('dir /b zombie-ai-assistant-*.vsix 2^>nul') do set VSIX_FILE=%%f

if not defined VSIX_FILE (
    echo Error: VSIX file was not created
    exit /b 1
)

echo Step 6: Moving VSIX to dist folder...
if not exist "%PROJECT_DIR%\dist" mkdir "%PROJECT_DIR%\dist"
copy /y "%VSIX_FILE%" "%PROJECT_DIR%\dist\"
echo VSIX moved: dist\!VSIX_FILE!
echo.

echo ================================
echo Build completed successfully!
echo ================================
echo.
echo VSIX Package: dist\!VSIX_FILE!
echo.
echo To install locally:
echo   code --install-extension dist\!VSIX_FILE!
echo.
echo To publish to marketplace:
echo   cd extension
echo   vsce publish
echo.

endlocal
