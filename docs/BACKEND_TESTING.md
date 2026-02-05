# ZombieCoder Backend Testing Documentation

এই ডকুমেন্টে ZombieCoder Backend Server এর সম্পূর্ণ testing গাইড রয়েছে।

## 📋 সূচিপত্র

1. [সার্ভার চালু করা](#সার-ভার-চাল-করা)
2. [REST API Endpoints টেস্ট](#rest-api-endpoints-টসট)
3. [WebSocket টেস্ট](#websocket-টসট)
4. [Ollama Configuration](#ollama-configuration)
5. [সমস্যা সমাধান](#সমসযা-সমাধান)

---

## সার্ভার চালু করা

### Prerequisites

- Node.js 18+ installed
- Ollama installed এবং চালু (local AI models এর জন্য)
- Backend dependencies installed

### Development Mode

```bash
cd ~/zombiecoder/backend
npm run dev
```

Server চালু হবে: `http://localhost:8001`

### Production Mode

```bash
cd ~/zombiecoder/backend
npm run build
npm start
```

### Environment Variables

`.env` ফাইলে নিচের configuration থাকতে হবে:

```env
# Server Configuration
PORT=8001
NODE_ENV=development

# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_TIMEOUT=30000

# Optional: OpenAI (যদি OpenAI models ব্যবহার করতে চান)
OPENAI_API_KEY=your_openai_api_key_here

# Database
DATABASE_URL=sqlite:./zombi.db
```

---

## REST API Endpoints টেস্ট

### 1. Health Check ✅

সার্ভার চালু আছে কিনা চেক করুন:

```bash
curl http://localhost:8001/v1/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-03T21:29:14.053Z",
  "uptime": 12.343,
  "server": "ZombieCoder Backend",
  "version": "2.0.0",
  "environment": "development",
  "websocket": {
    "enabled": true,
    "activeConnections": 0,
    "endpoint": "/v1/chat/ws"
  },
  "features": {
    "streaming": true,
    "websockets": true,
    "vscode_integration": true,
    "ollama_support": true,
    "multi_model": true
  }
}
```

### 2. VS Code Info

```bash
curl http://localhost:8001/v1/vscode/info
```

**Expected Response:**
```json
{
  "extension": {
    "name": "ZombieCoder AI Assistant",
    "version": "2.0.0",
    "description": "আমি ZombieCoder, যেখানে কোড ও কথা বলে।"
  },
  "capabilities": [
    "streaming_chat",
    "websocket_support",
    "multi_model",
    "code_analysis",
    "bengali_english_support"
  ],
  "endpoints": {
    "health": "/v1/health",
    "chat_stream": "/v1/chat/stream",
    "chat_ws": "/v1/chat/ws",
    "models": "/v1/chat/models",
    "runtime": "/v1/runtime_status"
  },
  "websocket": {
    "activeConnections": 0,
    "activeSessions": []
  }
}
```

### 3. Available Models

```bash
curl http://localhost:8001/api/models
```

**Expected Response:**
```json
{
  "models": [
    {
      "id": 1,
      "name": "qwen2.5-0.5b",
      "displayName": "Qwen 2.5 0.5B (Fast)",
      "provider": "ollama",
      "modelId": "qwen2.5:0.5b",
      "maxTokens": 4096,
      "temperature": 0.7,
      "isActive": true,
      "isDefault": true,
      "usageCount": 2
    }
  ],
  "total": 3,
  "active": 3
}
```

### 4. Chat Models (with Ollama list)

```bash
curl http://localhost:8001/v1/chat/models
```

এটি configured models এবং Ollama থেকে available সব models দেখাবে।

### 5. Runtime Status

```bash
curl http://localhost:8001/v1/runtime_status
```

**Expected Response:**
```json
{
  "server": {
    "status": "running",
    "uptime": 44,
    "version": "1.0.0",
    "nodeVersion": "v24.13.0",
    "platform": "linux"
  },
  "resources": {
    "memory": {
      "used": 114,
      "total": 15858
    }
  },
  "services": {
    "database": {
      "status": "healthy",
      "type": "sqlite",
      "modelsConfigured": 3
    },
    "ollama": {
      "status": "unknown",
      "endpoint": "http://localhost:11434",
      "modelsAvailable": 0
    }
  },
  "models": {
    "configured": [...]
  }
}
```

### 6. Test Endpoint

```bash
curl http://localhost:8001/test
```

Simple endpoint যা server working কিনা confirm করে।

---

## WebSocket টেস্ট

### WebSocket Endpoint

```
ws://localhost:8001/v1/chat/ws
```

### Node.js WebSocket Client Example

`test-websocket.js` ফাইল তৈরি করুন:

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8001/v1/chat/ws');

ws.on('open', function open() {
    console.log('✅ Connected to ZombieCoder WebSocket');

    // Send a chat message
    const message = {
        type: 'chat',
        id: Date.now().toString(),
        data: {
            prompt: 'Write a hello world function in Python',
            model: 'qwen2.5:0.5b',
            context: null
        }
    };

    ws.send(JSON.stringify(message));
});

ws.on('message', function message(data) {
    const response = JSON.parse(data.toString());

    switch(response.type) {
        case 'welcome':
            console.log('Welcome:', response.data);
            break;

        case 'chat_start':
            console.log('Chat started with model:', response.data.model);
            break;

        case 'chat_chunk':
            process.stdout.write(response.data.content);
            break;

        case 'chat_complete':
            console.log('\n\nChat completed!');
            console.log('Response length:', response.data.responseLength);
            ws.close();
            break;

        case 'error':
            console.error('Error:', response.data.error);
            ws.close();
            break;
    }
});

ws.on('error', function error(err) {
    console.error('WebSocket error:', err.message);
});

ws.on('close', function close() {
    console.log('Connection closed');
    process.exit(0);
});
```

### Run WebSocket Test

```bash
cd ~/zombiecoder
node test-websocket.js
```

### Expected Output

```
✅ Connected to ZombieCoder WebSocket
📤 Sending chat message...

📨 Received: session
🚀 Chat started with model: qwen2.5:0.5b
📝 Response:

def hello_world():
    print("Hello, World!")

hello_world()

✅ Chat completed!
📊 Response length: 67
🤖 Model used: qwen2.5:0.5b

👋 Connection closed
```

### WebSocket Message Types

#### Client → Server

1. **Chat Message**
```json
{
  "type": "chat",
  "id": "unique-message-id",
  "data": {
    "prompt": "Your question here",
    "model": "qwen2.5:0.5b",
    "context": {}
  }
}
```

2. **Session Update**
```json
{
  "type": "session",
  "id": "unique-message-id",
  "data": {
    "action": "update",
    "data": {}
  }
}
```

3. **Model Switch**
```json
{
  "type": "model_switch",
  "id": "unique-message-id",
  "data": {
    "modelId": "qwen2.5:1.5b"
  }
}
```

#### Server → Client

1. **Welcome Message**
```json
{
  "type": "welcome",
  "data": {
    "status": "connected",
    "server": "ZombieCoder Backend",
    "version": "2.0.0"
  }
}
```

2. **Chat Start**
```json
{
  "type": "chat_start",
  "id": "message-id",
  "data": {
    "model": "qwen2.5:0.5b"
  }
}
```

3. **Chat Chunk (Streaming)**
```json
{
  "type": "chat_chunk",
  "id": "message-id",
  "data": {
    "content": "token text",
    "model": "qwen2.5:0.5b"
  }
}
```

4. **Chat Complete**
```json
{
  "type": "chat_complete",
  "id": "message-id",
  "data": {
    "fullResponse": "complete response text",
    "model": "qwen2.5:0.5b",
    "responseLength": 123
  }
}
```

5. **Error**
```json
{
  "type": "error",
  "id": "message-id",
  "data": {
    "error": "error message"
  }
}
```

---

## Ollama Configuration

### Ollama Installation

```bash
# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve
```

### Download Models

```bash
# Fast model (recommended for testing)
ollama pull qwen2.5:0.5b

# Better quality model
ollama pull qwen2.5:1.5b

# Embedding model (for RAG)
ollama pull nomic-embed-text
```

### Check Ollama Status

```bash
curl http://localhost:11434/api/tags
```

### Test Ollama Directly

```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:0.5b",
    "prompt": "Say hello in 5 words",
    "stream": false
  }'
```

### Available Ollama Models

Backend স্বয়ংক্রিয়ভাবে এই models support করে:
- `qwen2.5:0.5b` - Fast, lightweight
- `qwen2.5:1.5b` - Better quality
- `llama2` - General purpose
- `mistral` - Good performance
- `codellama` - Code specialized
- `nomic-embed-text` - Embeddings for RAG

---

## সমস্যা সমাধান

### Problem: Backend connection failed

**Check:**
```bash
# Is backend running?
curl http://localhost:8001/v1/health

# Check backend logs
tail -f /tmp/backend.log
```

**Solution:**
```bash
cd ~/zombiecoder/backend
npm run dev
```

### Problem: Ollama not responding

**Check:**
```bash
# Is Ollama running?
curl http://localhost:11434/api/tags

# Check Ollama service
systemctl status ollama
```

**Solution:**
```bash
# Start Ollama
ollama serve

# Or restart service
sudo systemctl restart ollama
```

### Problem: WebSocket connection timeout

**Check:**
```bash
# Test WebSocket endpoint
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://localhost:8001/v1/chat/ws
```

**Expected Response:**
```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
```

### Problem: Chat returns no response

**Debug Steps:**

1. Check backend logs:
```bash
tail -f /tmp/backend.log | grep -i "ollama\|stream\|token"
```

2. Test Ollama directly:
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen2.5:0.5b", "prompt": "Hello", "stream": false}'
```

3. Check model availability:
```bash
curl http://localhost:8001/v1/chat/models
```

### Problem: "Model not found"

**Solution:**
```bash
# List available models
ollama list

# Pull the required model
ollama pull qwen2.5:0.5b
```

### Problem: Port 8001 already in use

**Solution:**
```bash
# Find process using port 8001
lsof -i :8001

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=8002
```

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:8001/v1/health

# Results to look for:
# - Requests per second: > 500
# - Time per request: < 20ms
# - Failed requests: 0
```

### WebSocket Concurrent Connections

```bash
# Test multiple WebSocket connections
for i in {1..10}; do
  node test-websocket.js &
done
```

### Memory Usage

```bash
# Monitor backend memory
ps aux | grep "tsx watch"

# Check detailed stats
curl http://localhost:8001/v1/runtime_status | jq '.resources.memory'
```

---

## Integration Testing

### Full Stack Test Flow

1. **Start Backend**
```bash
cd ~/zombiecoder/backend
npm run dev
```

2. **Start Frontend**
```bash
cd ~/zombiecoder
npm run dev
```

3. **Test WebSocket from Frontend**
   - Open `http://localhost:3001`
   - Open browser console
   - Run:
```javascript
const ws = new WebSocket('ws://localhost:8001/v1/chat/ws');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.onopen = () => ws.send(JSON.stringify({
  type: 'chat',
  id: '1',
  data: { prompt: 'Hello', model: 'qwen2.5:0.5b' }
}));
```

---

## Test Summary Checklist

- [ ] Backend server starts successfully
- [ ] Health check returns 200 OK
- [ ] VS Code info endpoint responds
- [ ] Models API returns configured models
- [ ] Runtime status shows healthy database
- [ ] Ollama service is running
- [ ] WebSocket connection establishes
- [ ] Chat streaming works via WebSocket
- [ ] Ollama models respond correctly
- [ ] No memory leaks over time
- [ ] Logs show no errors

---

## Useful Commands

### Backend Management

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

### Quick Health Check

```bash
# One-liner to check all services
echo "Backend:" && curl -s http://localhost:8001/v1/health | jq '.status' && \
echo "Ollama:" && curl -s http://localhost:11434/api/tags | jq '.models | length'
```

### Log Monitoring

```bash
# Follow backend logs
tail -f /tmp/backend.log

# Filter for errors only
tail -f /tmp/backend.log | grep -i "error\|fail"

# Filter for chat activity
tail -f /tmp/backend.log | grep -i "chat\|stream"
```

---

## API Testing with curl

### Complete REST API Test Suite

```bash
#!/bin/bash
# test-backend.sh - Complete backend test suite

echo "=== ZombieCoder Backend Test Suite ==="
echo ""

echo "1. Testing Health Check..."
curl -s http://localhost:8001/v1/health | jq .
echo ""

echo "2. Testing VS Code Info..."
curl -s http://localhost:8001/v1/vscode/info | jq .
echo ""

echo "3. Testing Models API..."
curl -s http://localhost:8001/api/models | jq .
echo ""

echo "4. Testing Runtime Status..."
curl -s http://localhost:8001/v1/runtime_status | jq .
echo ""

echo "5. Testing Ollama Integration..."
curl -s http://localhost:11434/api/tags | jq '.models | length'
echo ""

echo "=== All Tests Completed ==="
```

Run:
```bash
chmod +x test-backend.sh
./test-backend.sh
```

---

## Conclusion

এই documentation follow করে আপনি ZombieCoder Backend সম্পূর্ণভাবে test করতে পারবেন।

**Important Points:**
- WebSocket হল primary communication method (REST API নয়)
- Ollama local AI models provide করে (no OpenAI API key needed)
- সব streaming WebSocket এর মাধ্যমে হয়
- Backend সম্পূর্ণ local-first (no cloud dependency)

**Support:**
- GitHub Issues: Report problems
- Documentation: `zombiecoder/docs/`
- Email: infi@zombiecoder.my.id

---

**Happy Testing! 🧟‍♂️🚀**
