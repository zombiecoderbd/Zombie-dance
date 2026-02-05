# ZombieCursor AI - Quick Start Guide

Welcome to ZombieCursor AI! This guide will get you up and running in minutes.

## Installation

### Option 1: Install VSIX Directly

1. Download the latest `zombie-ai-assistant-X.X.X.vsix` file
2. Open VS Code
3. Go to Extensions (Ctrl+Shift+X)
4. Click "Install from VSIX..."
5. Select the downloaded file

### Option 2: Build from Source

\`\`\`bash
git clone https://github.com/zombiecoder1/TypeScript-extensions-VS-Code
cd TypeScript-extensions-VS-Code
bash scripts/package-extension.sh
code --install-extension dist/zombie-ai-assistant-*.vsix
\`\`\`

## Initial Setup

### 1. Accept Safety Agreement

When you first launch ZombieCursor, you'll see a safety agreement screen. Read and click "I Agree & Continue" to proceed.

### 2. Configure Backend

Open VS Code settings:
- Press `Ctrl+,` (or `Cmd+,` on Mac)
- Search for "zombie"
- Set the endpoint URL (default: `http://localhost:8001`)

### 3. Add API Key

When prompted, enter your API key. It will be stored securely in VS Code's secret storage.

## Using ZombieCursor

### Open Chat

Press `Ctrl+Shift+Z` (or `Cmd+Shift+Z` on Mac) to open the chat interface.

### Chat Commands

In the chat, use these commands:

- `/explain` - Explain selected code
- `/refactor` - Improve code quality
- `/fix` - Find and fix bugs
- `/optimize` - Optimize for performance

### Right-Click Context Menu

Right-click on selected code and choose:
- "Explain Code"
- "Refactor Code"

### Index Your Project

To enable RAG (Retrieval Augmented Generation):

1. Open Command Palette (Ctrl+Shift+P)
2. Type "Index This Project"
3. Wait for indexing to complete

This allows ZombieCursor to understand your entire codebase.

### View Chat History

Open Command Palette and type "Show Chat History" to access previous conversations.

## Features

### Dance Flow Animations

Watch as ZombieCursor shows code changes with smooth animations. Configure animation speed in settings:

- `zombie.animationSpeed`: 50-1000ms (default: 200ms)

### Terminal Safety (ATSL)

When ZombieCursor suggests terminal commands:
- A permission popup appears
- Review the command before allowing
- Choose "Allow Once" or "Allow for This Session"
- Never runs without explicit permission

### Local History

All chat conversations are saved locally:
- Located in `~/.zombiecursor/data/history/`
- Never sent to servers
- Delete any time

### Project Indexing (LRIE)

After indexing your project:
- Search across entire codebase
- Better context awareness
- Faster, smarter suggestions

## Troubleshooting

### "Backend connection failed"

1. Ensure backend server is running
2. Check endpoint configuration: `zombie.endpoint`
3. Test connection: `curl http://localhost:8001/v1/health`

### "API key not recognized"

1. Verify API key in settings
2. Check for typos or extra spaces
3. Re-enter the API key if needed

### Extension not activating

1. Reload VS Code: `Ctrl+R`
2. Check the Output panel for error messages
3. Ensure VS Code version ≥ 1.85.0

## Privacy & Security

ZombieCursor is completely local-first:

- Your code stays on YOUR computer
- No data transmission to external servers
- No tracking or telemetry
- You control all terminal execution
- API keys stored securely in VS Code

## Next Steps

1. Try explaining a piece of code
2. Test code refactoring
3. Index your project for better suggestions
4. Configure your preferences in settings

## Getting Help

- Check the full documentation: See `docs/` folder
- Report issues on GitHub
- Review safety guidelines: See `ZOMBIE_SAFETY_AGREEMENT.md`

Enjoy using ZombieCursor AI!
