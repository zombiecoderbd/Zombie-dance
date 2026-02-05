# Installation Guide - Linux

## Prerequisites

- Linux distribution (Ubuntu, Debian, Fedora, etc.)
- Node.js 18+ 
- npm or yarn
- VS Code 1.85+
- Git

## Installation Steps

### 1. Install Node.js (Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone Repository

```bash
git clone https://github.com/zombiecoder1/TypeScript-extensions-VS-Code.git
cd TypeScript-extensions-VS-Code
```

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Extension
cd ../extension
npm install
```

### 4. Setup Environment

```bash
# Copy example env
cp backend/.env.example backend/.env

# Edit with your preferred editor
nano backend/.env
```

### 5. Build Extension

```bash
chmod +x scripts/build-all.sh
./scripts/build-all.sh
```

### 6. Install in VS Code

```bash
# Install from VSIX
code --install-extension dist/zombie-ai-assistant-*.vsix
```

Or use GUI:
1. Open VS Code
2. Extensions > ... > Install from VSIX
3. Select generated `.vsix` file

## Optional: Ollama Setup (Local LLM)

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Run Ollama service
ollama serve

# In another terminal, pull a model
ollama pull llama2
```

## Troubleshooting

### Permission Denied
```bash
chmod +x scripts/*.sh
```

### npm Command Not Found
```bash
# Reinstall Node.js or check PATH
which node
echo $PATH
```

### Port Already in Use
```bash
# Find process using port 8001
lsof -i :8001

# Kill it (replace PID with actual process ID)
kill -9 PID
```

For more details, see [USAGE.md](./USAGE.md).
