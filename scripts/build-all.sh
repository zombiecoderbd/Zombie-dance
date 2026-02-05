#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "================================"
echo "Building ZombieCursor Extension"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js not found${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "${RED}Error: npm not found${NC}"
  exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ Node.js $NODE_VERSION${NC}"
echo -e "${GREEN}✓ npm $NPM_VERSION${NC}"
echo ""

echo -e "${BLUE}Step 2: Installing extension dependencies...${NC}"
cd "$PROJECT_DIR/extension"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}Step 3: Running TypeScript compiler...${NC}"
npm run compile
echo -e "${GREEN}✓ TypeScript compiled${NC}"
echo ""

echo -e "${BLUE}Step 4: Running linter...${NC}"
npm run lint || echo -e "${RED}⚠ Lint warnings (non-fatal)${NC}"
echo ""

echo -e "${BLUE}Step 5: Running tests...${NC}"
npm test || echo -e "${RED}⚠ Tests failed (check manually)${NC}"
echo ""

echo -e "${BLUE}Step 6: Creating VSIX package...${NC}"
rm -f zombie-ai-assistant-*.vsix
npm run package
echo -e "${GREEN}✓ VSIX package created${NC}"
echo ""

VSIX_FILE=$(ls zombie-ai-assistant-*.vsix 2>/dev/null | head -1)
if [ -n "$VSIX_FILE" ]; then
  echo -e "${BLUE}Step 7: Moving VSIX to dist/...${NC}"
  mkdir -p "$PROJECT_DIR/dist"
  cp "$VSIX_FILE" "$PROJECT_DIR/dist/"
  echo -e "${GREEN}✓ VSIX moved: dist/$VSIX_FILE${NC}"
else
  echo -e "${RED}Error: VSIX file not created${NC}"
  exit 1
fi

echo ""
echo "================================"
echo -e "${GREEN}Build completed successfully!${NC}"
echo "================================"
echo ""
echo "VSIX Package: dist/$VSIX_FILE"
echo ""
echo "To install locally:"
echo "  code --install-extension dist/$VSIX_FILE"
echo ""
echo "To publish to marketplace:"
echo "  cd extension"
echo "  vsce publish"
echo ""
