#!/bin/bash

# Build VSIX Package Script
set -e

echo "[v0] Starting VSIX build process..."

# Clean previous builds
rm -rf dist/
mkdir -p dist/

# Build Next.js application
echo "[v0] Building Next.js application..."
npm run build

# Create VSIX directory structure
echo "[v0] Creating VSIX structure..."
mkdir -p vsix-temp/extension
mkdir -p vsix-temp/extension/.vscode

# Copy essential files
cp -r .next vsix-temp/extension/
cp package.json vsix-temp/extension/
cp next.config.mjs vsix-temp/extension/
cp tsconfig.json vsix-temp/extension/

# Create package.json for VSIX
cat > vsix-temp/extension/package.json << 'EOF'
{
  "name": "zombiecursor-ai",
  "version": "2.0.0",
  "displayName": "ZombieCursor AI Assistant",
  "description": "Advanced AI-powered development assistant with LSP/DAP protocols",
  "main": ".next/server/index.js",
  "publisher": "SahonSrabon",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["AI", "Development Tools"],
  "activationEvents": ["onStartupFinished"],
  "contributes": {
    "commands": [
      {
        "command": "zombiecursor.openPanel",
        "title": "Open ZombieCursor AI Panel"
      },
      {
        "command": "zombiecursor.backup",
        "title": "Create System Backup"
      },
      {
        "command": "zombiecursor.restore",
        "title": "Restore from Backup"
      }
    ],
    "viewsContainers": {
      "activitybar": [
        {
          "id": "zombiecursor-explorer",
          "title": "ZombieCursor AI",
          "icon": "resources/zombie-icon.svg"
        }
      ]
    },
    "views": {
      "zombiecursor-explorer": [
        {
          "id": "zombiecursor-panel",
          "name": "AI Assistant",
          "type": "webview"
        }
      ]
    }
  }
}
EOF

# Create vsixmanifest.json
cat > vsix-temp/extension/vsixmanifest.json << 'EOF'
{
  "metadata": {
    "id": "zombiecursor-ai-assistant",
    "version": "2.0.0",
    "displayName": "ZombieCursor AI Assistant",
    "description": "Advanced AI-powered development environment with LSP/DAP support",
    "publisher": "SahonSrabon"
  },
  "resources": [
    {
      "path": "extension",
      "addressable": true
    }
  ]
}
EOF

# Validate VSIX structure
echo "[v0] Validating VSIX structure..."
if [ ! -f "vsix-temp/extension/package.json" ]; then
  echo "[v0] ERROR: package.json not found in VSIX structure"
  exit 1
fi

if [ ! -d "vsix-temp/extension/.next" ]; then
  echo "[v0] ERROR: Built application not found"
  exit 1
fi

# Create final VSIX file
echo "[v0] Creating VSIX package..."
cd vsix-temp
zip -r ../dist/zombiecursor-ai-assistant-2.0.0.vsix extension/
cd ..

# Verify VSIX file
if [ -f "dist/zombiecursor-ai-assistant-2.0.0.vsix" ]; then
  SIZE=$(du -h dist/zombiecursor-ai-assistant-2.0.0.vsix | cut -f1)
  echo "[v0] VSIX package created successfully!"
  echo "[v0] File size: $SIZE"
  echo "[v0] Location: dist/zombiecursor-ai-assistant-2.0.0.vsix"
else
  echo "[v0] ERROR: VSIX file was not created"
  exit 1
fi

# Cleanup
rm -rf vsix-temp/

echo "[v0] VSIX build process completed successfully!"
