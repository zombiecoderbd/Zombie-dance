# Environment Setup Guide

## What You'll Need

### Minimum Requirements
- VS Code 1.85+
- Node.js 18+ (includes npm)
- 2GB RAM available
- 500MB disk space

### Recommended
- VS Code latest
- Node.js 20 LTS
- 4GB+ RAM
- 2GB SSD space
- Internet connection (for AI API calls)

## Step 1: Install Prerequisites

### Windows

1. **Install Node.js**
   - Download from https://nodejs.org/
   - Choose LTS (Long Term Support)
   - Run installer, accept defaults
   - Verify: Open PowerShell, type `node -v` and `npm -v`

2. **Install Git**
   - Download from https://git-scm.com/
   - Run installer, accept defaults

3. **Install VS Code**
   - Download from https://code.visualstudio.com/
   - Run installer

### Linux (Ubuntu/Debian)

```bash
# Update package manager
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install VS Code
sudo apt install -y code
```

### macOS

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install Git (comes with Xcode Command Line Tools)
xcode-select --install

# Install VS Code
brew install --cask visual-studio-code
```

## Step 2: Clone Repository

```bash
# Windows (PowerShell)
git clone https://github.com/zombiecoder1/TypeScript-extensions-VS-Code.git
cd TypeScript-extensions-VS-Code

# Linux/macOS
git clone https://github.com/zombiecoder1/TypeScript-extensions-VS-Code.git
cd TypeScript-extensions-VS-Code
```

## Step 3: Install Dependencies

```bash
# Install extension dependencies
cd extension
npm install

# Go back to root
cd ..
```

## Step 4: Build Extension

### Windows (PowerShell)
```powershell
.\scripts\build-all.bat
```

### Linux/macOS
```bash
chmod +x scripts/build-all.sh
./scripts/build-all.sh
```

## Step 5: Install in VS Code

```bash
# Install from VSIX file
code --install-extension dist/zombie-ai-assistant-2.0.0.vsix
```

Or:
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Click "... → Install from VSIX"
4. Select the VSIX file from `dist/` folder

## Step 6: Configure API Keys

1. Open VS Code Settings (Ctrl+,)
2. Search for "ZombieCursor"
3. Configure:
   - **Provider**: OpenAI, Anthropic, or Ollama
   - **API Key**: Your provider's API key
   - **Model**: Default or your preference

## Step 7: Start Using

1. Press `Ctrl+Shift+Z` (or `Cmd+Shift+Z` on Mac) to open chat
2. Type your first message
3. Click index button to index your project
4. Start chatting!

## Troubleshooting Setup

### "Node not found"
```bash
# Check installation
node --version
npm --version

# If not found, reinstall Node.js from nodejs.org
```

### npm permission errors
```bash
# On Linux/Mac, fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### vsce package error
```bash
# Install vsce globally
npm install -g @vscode/vsce

# Then try packaging again
vsce package
```

## Next Steps

1. Read [USAGE.md](./USAGE.md) for features
2. Check [CONFIG.md](./CONFIG.md) for advanced settings
3. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for issues

## Getting Help

- **Issues**: GitHub Issues
- **Email**: infi@zombiecoder.my.id
- **Documentation**: See docs/ folder
