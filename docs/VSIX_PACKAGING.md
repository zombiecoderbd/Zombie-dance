# VSIX Packaging Guide

## What is a VSIX File?

A VSIX (Visual Studio Code Extension) file is a packaged extension that can be directly installed in VS Code without source code compilation.

## Creating VSIX File

### Automatic (Recommended)

```bash
# Linux/Mac
chmod +x scripts/package-extension.sh
./scripts/package-extension.sh

# Windows
.\scripts\package-extension.bat
```

### Manual Process

```bash
cd extension

# Install vsce tool
npm install -g @vscode/vsce

# Package extension
vsce package

# Output: zombie-ai-assistant-2.0.0.vsix
```

## Distributing VSIX

### Option 1: Direct Distribution
- Share `.vsix` file directly
- Users install via: `code --install-extension file.vsix`

### Option 2: VS Code Marketplace
1. Create publisher account on [VS Code Marketplace](https://marketplace.visualstudio.com/)
2. Publish extension: `vsce publish`

## Verifying VSIX Package

```bash
# List contents
unzip -l zombie-ai-assistant-2.0.0.vsix

# Check manifest
unzip -p zombie-ai-assistant-2.0.0.vsix extension/package.json | jq .
```

## Installing from VSIX

### Method 1: VS Code GUI
1. Extensions > ... > Install from VSIX
2. Select `.vsix` file
3. Click Install

### Method 2: CLI
```bash
code --install-extension path/to/zombie-ai-assistant-2.0.0.vsix
```

### Method 3: Programmatic
```javascript
// Inside VS Code extension
vscode.commands.executeCommand(
  "workbench.extensions.installExtension",
  "file:///path/to/zombie-ai-assistant-2.0.0.vsix"
)
```

## Package Contents

VSIX files include:
- Compiled extension code (dist/)
- Package manifest (package.json)
- Media assets (icons, logos)
- Documentation files
- License information

## Troubleshooting

### "Failed to package extension"
- Check `extension/package.json` syntax
- Verify all required files exist
- Check Node.js version (18+)

### Size too large
- Exclude unnecessary files in `.vscodeignore`
- Remove node_modules from package
- Strip debug symbols

See [INSTALL_WINDOWS.md](./INSTALL_WINDOWS.md) or [INSTALL_LINUX.md](./INSTALL_LINUX.md) for full installation.
