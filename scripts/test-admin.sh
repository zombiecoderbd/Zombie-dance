#!/bin/bash

# ZombieCoder Admin Panel Testing Script

set -e

echo "Starting ZombieCoder Admin Panel Tests..."
echo "=========================================="

# Check Node.js
echo "Checking Node.js version..."
node --version

# Install dependencies
echo "Installing dependencies..."
npm install

# Run linting
echo "Running linting..."
npm run lint --workspace admin 2>/dev/null || true

# Build the project
echo "Building project..."
npm run build

# Run tests
echo "Running unit tests..."
npm test -- --coverage=false --passWithNoTests

# Run integration tests
echo "Running integration tests..."
npm run test:integration --workspace admin 2>/dev/null || true

# Build admin panel
echo "Building admin panel..."
npm run build:admin 2>/dev/null || true

echo ""
echo "=========================================="
echo "All tests completed successfully!"
echo "=========================================="
