@echo off
setlocal

for %%I in ("%~dp0..") do set "PROJECT_DIR=%%~fI"
cd /d "%PROJECT_DIR%\extension"

echo ================================
echo Creating VSIX Package
echo ================================
echo.

REM Check for vsce
where vsce >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing vsce...
    call npm install -g @vscode/vsce
)

echo Compiling extension...
call npm run compile
if %ERRORLEVEL% NEQ 0 (
    echo Error: Compilation failed
    exit /b 1
)

echo.
echo Creating VSIX file...
call vsce package

for /f %%f in ('dir /b zombie-ai-assistant-*.vsix 2^>nul') do (
    echo.
    echo Package created: %%f
    echo.
    echo Installation methods:
    echo 1. From VS Code:
    echo    Extensions ^> ... ^> Install from VSIX
    echo.
    echo 2. From command line:
    echo    code --install-extension %%f
    echo.
    exit /b 0
)

echo Error: VSIX file not created
exit /b 1
