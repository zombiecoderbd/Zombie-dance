#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Installing ZombieCursor locally..."

VSIX_FILE=$(find "$PROJECT_DIR/dist" -name "zombie-ai-assistant-*.vsix" | head -1)

if [ -z "$VSIX_FILE" ]; then
  echo "Error: No VSIX file found in dist/"
  echo "Please run: bash scripts/build-all.sh"
  exit 1
fi

echo "Found VSIX: $VSIX_FILE"

if ! command -v code &> /dev/null; then
  echo "Error: VS Code command-line tool not found"
  echo "Please ensure VS Code is installed and 'code' is in PATH"
  exit 1
fi

code --install-extension "$VSIX_FILE"

echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Reload VS Code (Cmd+R on Mac, Ctrl+R on Windows/Linux)"
echo "2. Press Ctrl+Shift+Z to open ZombieCursor chat"
echo "3. Configure your API key in settings"
echo ""
