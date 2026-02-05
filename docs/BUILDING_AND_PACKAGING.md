# Building and Packaging ZombieCursor AI Extension

## Prerequisites

- Node.js 16+ and npm
- VS Code 1.85.0 or higher
- Git

## Building the Extension

### 1. Install Dependencies

\`\`\`bash
cd extension
npm install
\`\`\`

### 2. Compile TypeScript

\`\`\`bash
npm run compile
\`\`\`

### 3. Run Tests (Optional)

\`\`\`bash
npm test
\`\`\`

### 4. Package as VSIX

\`\`\`bash
npm run package
\`\`\`

This will create a file named `zombie-ai-assistant-X.X.X.vsix` in the `extension/` directory.

## Using the Package Script

For convenience, use the provided shell script:

\`\`\`bash
cd /path/to/TypeScript-extensions-VS-Code
bash scripts/package-extension.sh
\`\`\`

The VSIX file will be created in `dist/`.

## Installing the Extension Locally

### Method 1: From VS Code UI

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Click "Install from VSIX..."
4. Select the generated `.vsix` file

### Method 2: From Command Line

\`\`\`bash
code --install-extension zombie-ai-assistant-X.X.X.vsix
\`\`\`

## Publishing to VS Code Marketplace

### Prerequisites

- Microsoft account
- Personal Access Token (PAT) from Azure DevOps

### Steps

1. Create publisher account at https://marketplace.visualstudio.com/manage/publishers

2. Get PAT and login to vsce:

\`\`\`bash
vsce login <publisher-name>
\`\`\`

3. Publish:

\`\`\`bash
cd extension
vsce publish
\`\`\`

## Configuration After Installation

After installing the extension:

1. Open VS Code settings (Ctrl+,)
2. Search for "zombie"
3. Configure:
   - **endpoint**: Your backend server URL
   - **apiKey**: Your API key (stored securely)
   - **model**: LLM model to use
   - **allowTerminalCommands**: Enable/disable terminal execution

## Troubleshooting

### "vsce: command not found"

Install globally:

\`\`\`bash
npm install -g @vscode/vsce
\`\`\`

### TypeScript compilation errors

Ensure TypeScript version matches:

\`\`\`bash
npm install -g typescript@5.3
\`\`\`

### VSIX creation fails

Check:
- All TypeScript files compile without errors
- `package.json` has correct metadata
- `icon.png` exists in `resources/`
- All dependencies are listed in `package.json`

## Development Workflow

### Watch Mode

For development with auto-compile:

\`\`\`bash
cd extension
npm run watch
\`\`\`

### Testing in VS Code

1. Open extension folder in VS Code
2. Press `F5` to start Extension Development Host
3. A new VS Code window opens with the extension loaded
4. Test functionality and debug as needed

## Version Management

Update version in `extension/package.json`:

\`\`\`json
{
  "version": "1.0.0"
}
\`\`\`

Follow semantic versioning: `MAJOR.MINOR.PATCH`

## File Structure

\`\`\`
extension/
├── src/
│   ├── extension.ts         # Main entry point
│   ├── agents/              # AI agents
│   ├── services/            # Core services
│   ├── permissions/         # Permission system
│   ├── history/             # History management
│   ├── indexing/            # Project indexing
│   ├── animations/          # Dance flow engine
│   ├── safety/              # Safety agreement
│   └── types/               # TypeScript types
├── dist/                    # Compiled JavaScript
├── out/                     # Test outputs
├── package.json
├── tsconfig.json
└── resources/
    └── icon.png
\`\`\`

## Next Steps

After packaging:

1. Test the VSIX locally
2. Configure backend server
3. Set API keys in VS Code settings
4. Start using ZombieCursor!

For issues, refer to the main README and documentation.
