#!/bin/bash

echo "[v0] Starting comprehensive test suite..."

# Unit tests
echo "[v0] Running unit tests..."
npm run test:unit

# Integration tests
echo "[v0] Running integration tests..."
npm run test:integration

# End-to-end tests
echo "[v0] Running E2E tests..."
npm run test:e2e

# Coverage report
echo "[v0] Generating coverage report..."
npm run test:coverage

echo "[v0] All tests completed!"
