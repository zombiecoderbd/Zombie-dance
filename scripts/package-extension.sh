#!/bin/bash

set -e

echo "Building ZombieCursor Extension..."
cd extension

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/ out/

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Compile TypeScript
echo "Compiling TypeScript..."
npm run compile

# Package VSIX
echo "Packaging VSIX file..."
npm run package

# Move VSIX to output directory
if [ -f "zombie-ai-assistant-*.vsix" ]; then
  mkdir -p ../dist
  mv zombie-ai-assistant-*.vsix ../dist/
  echo "VSIX package created successfully!"
  echo "File location: $(ls ../dist/*.vsix)"
else
  echo "Error: VSIX file not created"
  exit 1
fi

echo "Done!"
