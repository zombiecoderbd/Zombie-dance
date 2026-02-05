# Testing Guide

## Unit Tests

### Running Tests

```bash
# Extension tests
cd extension
npm test

# Backend tests
cd backend
npm test

# With coverage
npm run test:coverage
```

### Writing Tests

**Example Test** (extension):
```typescript
import * as assert from 'assert'
import { IdentityManager } from '../identity/identityManager'

suite('Identity Manager Tests', () => {
  test('Should load identity correctly', () => {
    const manager = new IdentityManager()
    assert.strictEqual(manager.getName(), 'ZombieCoder')
  })

  test('Should return correct identity string', () => {
    const manager = new IdentityManager()
    const idString = manager.getIdentityString()
    assert.ok(idString.includes('Sahon Srabon'))
  })
})
```

## Integration Tests

### Testing Chat Flow

```typescript
test('Should handle chat message and return streaming response', async () => {
  const client = new AIClient('http://localhost:8001')
  const messages = [{ role: 'user', content: 'Hello' }]
  
  let fullResponse = ''
  for await (const chunk of client.chat(messages)) {
    fullResponse += chunk
  }
  
  assert.ok(fullResponse.length > 0)
})
```

### Testing RAG

```typescript
test('Should index and retrieve code correctly', async () => {
  const rag = new RAGEngine(workspaceRoot, vectorStore, embeddings)
  
  await rag.indexWorkspace()
  const context = await rag.retrieveContext('async function')
  
  assert.ok(context.relevantFiles.length > 0)
})
```

## Manual Testing

### Checklist

- [ ] Extension loads without errors
- [ ] Chat window opens (Ctrl+Shift+Z)
- [ ] Can send messages
- [ ] Receives responses
- [ ] RAG indexing works
- [ ] Diff application works
- [ ] Terminal commands blocked (unless permitted)
- [ ] Dark/Light theme switches
- [ ] Mobile view responsive

### User Flow Testing

1. **New User Flow**
   - Install extension
   - See safety agreement
   - Configure API key
   - Index project
   - Send first message
   - Apply a code diff

2. **Power User Flow**
   - Use slash commands
   - Search codebase
   - Chain multiple requests
   - Apply multiple diffs
   - Export chat history

## Performance Testing

```bash
# Measure startup time
time code --install-extension dist/zombie-ai-assistant-2.0.0.vsix

# Test indexing speed
time zombie.indexProject

# Profile memory usage
node --prof backend/src/server.js
```

## Security Testing

```bash
# Test dangerous command detection
# Should be blocked:
rm -rf /

# Should require permission:
npm install -g package

# Should work:
ls
echo "hello"
```

## Automated Testing

### CI/CD Pipeline (GitHub Actions)

See `.github/workflows/test.yml`

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
```

## Debugging

### VS Code Extension Debugging

1. Open extension folder in VS Code
2. Press F5 to start debug session
3. Set breakpoints in code
4. Use Debug console

### Backend Debugging

```bash
# Run with debugging
node --inspect-brk backend/src/server.js

# Open Chrome: chrome://inspect
```

## Test Coverage

Current coverage targets:
- Extension: >80%
- Backend: >85%
- Critical paths: 100%

```bash
# Generate coverage report
npm run test:coverage

# View report
open coverage/index.html
