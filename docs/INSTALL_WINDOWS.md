# Installation Guide - Windows 10/11

## Prerequisites

- Windows 10 or Windows 11
- Node.js 18+ ([Download](https://nodejs.org/))
- VS Code 1.85+
- Git ([Download](https://git-scm.com/))

## Step-by-Step Installation

### 1. Clone Repository

```bash
git clone https://github.com/zombiecoder1/TypeScript-extensions-VS-Code.git
cd TypeScript-extensions-VS-Code
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install extension dependencies
cd ../extension
npm install
```

### 3. Configure Environment

```bash
# Create backend .env file
copy backend\.env.example backend\.env
```

Edit `backend/.env`:
```
PORT=8001
API_KEY=your-secret-key-here
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4
LOG_LEVEL=info
```

### 4. Build and Package

```bash
# Run build script
.\scripts\build-all.bat

# Or manually:
cd extension
npm run compile
npm run package  # Creates VSIX file
```

### 5. Install Extension

**Option A: From VSIX File**
1. Open VS Code
2. Press `Ctrl+Shift+P`
3. Type "Extensions: Install from VSIX"
4. Select the generated `.vsix` file

**Option B: Load Unpacked**
1. Press `F5` in extension folder to open Extension Development Host

### 6. Configure LLM

1. Open VS Code Settings (`Ctrl+,`)
2. Search "ZombieCoder"
3. Configure your API key and provider:
   - OpenAI
   - Anthropic
   - Ollama (local)

## Troubleshooting

### Node.js Not Found
- Reinstall Node.js and add to PATH
- Restart your terminal/VS Code

### Port Already in Use
- Change `PORT` in `.env` file
- Or stop other services using port 8001

### API Key Errors
- Verify API key is correct
- Check key permissions in provider console
- Ensure key has no spaces

## Next Steps

See [USAGE.md](./USAGE.md) for usage instructions.
