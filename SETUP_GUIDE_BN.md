# ZombieCoder AI Assistant - সেটআপ গাইড

## 🎯 সংক্ষিপ্ত বিবরণ

**ZombieCoder** একটি সম্পূর্ণ local-first, OpenAI-compatible AI code assistant যা বাংলা ভাষায় কাজ করে। এটি Ollama ব্যবহার করে সম্পূর্ণ offline কাজ করতে পারে এবং যেকোনো editor (VS Code, Cursor, Continue, etc.) এ কাজ করবে যেগুলো OpenAI API support করে।

**মূল বৈশিষ্ট্য**:
- ✅ OpenAI API সম্পূর্ণ compatible
- ✅ Fake model names (gpt-4, claude-3, etc.) support
- ✅ Streaming এবং non-streaming
- ✅ WebSocket support
- ✅ Session management
- ✅ RAG (Retrieval-Augmented Generation)
- ✅ সম্পূর্ণ বাংলা support
- ✅ Privacy-focused (সব data local)

---

## 📋 প্রয়োজনীয় Software

### ১. Node.js (প্রয়োজনীয়)
- **Version**: 18.x বা তার বেশি
- **Download**: https://nodejs.org/
- **যাচাই করুন**: `node --version`

### ২. Ollama (প্রয়োজনীয়)
- **Download**: https://ollama.ai/
- **Install করার পর**: `ollama serve` command দিয়ে start করুন
- **যাচাই করুন**: `ollama list`

### ৩. Git (optional)
- **Download**: https://git-scm.com/

---

## 🚀 Quick Start (দ্রুত শুরু)

### ধাপ ১: Model Download করুন

```bash
# Default এবং দ্রুততম model
ollama pull qwen2.5-coder:0.5b

# অতিরিক্ত models (optional)
ollama pull qwen2.5-coder:1.5b
ollama pull deepseek-r1:1.5b
ollama pull deepseek-coder:1.3b
```

### ধাপ ২: Database Initialize করুন

```bash
node backend/init-db-fixed.cjs
```

**Expected Output**:
```
✅ Database initialization complete!
🎉 Imported 12 new Ollama models
```

### ধাপ ৩: Backend Build করুন

```bash
cd backend
npm run build
cd ..
```

### ধাপ ৪: সব কিছু একসাথে Start করুন

#### Windows:
```bash
start-zombiecoder.bat
```

#### Linux/Mac:
```bash
# Backend
cd backend && npm run dev &

# Proxy (নতুন terminal এ)
npm run proxy &
```

### ধাপ ৫: যাচাই করুন

```bash
# Health check
curl http://localhost:8001/v1/health

# Test chat
curl -X POST http://localhost:5010/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"gpt-3.5-turbo\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}"
```

---

## 🔧 Configuration

### Main Configuration File: `zombiecoder-config.json`

```json
{
  "server": {
    "ports": {
      "backend": 8001,
      "proxy": 5010
    }
  },
  "models": {
    "default": "qwen2.5-coder:0.5b",
    "aliases": {
      "gpt-4": "qwen2.5-coder:1.5b",
      "gpt-3.5-turbo": "qwen2.5-coder:0.5b",
      "claude-3-opus": "deepseek-coder:1.3b"
    }
  }
}
```

### Environment Variables (.env file)

```env
# Backend Settings
PORT=8001
NODE_ENV=production

# Ollama Settings
OLLAMA_HOST=http://localhost:11434

# Model Settings
DEFAULT_MODEL=qwen2.5-coder:0.5b
TEMPERATURE=0.7
MAX_TOKENS=4096

# Timeouts
STREAM_TIMEOUT=30000
REQUEST_TIMEOUT=30000

# CORS
CORS_ORIGINS=*

# Logging
LOG_LEVEL=info
```

---

## 🤖 Model Mapping (Fake Names)

যেকোনো editor যদি শুধুমাত্র OpenAI/Anthropic model names support করে, তাহলে এই fake names ব্যবহার করুন:

### OpenAI Models → Real Ollama Models

| Fake Name | Real Ollama Model | Speed | Quality |
|-----------|-------------------|-------|---------|
| `gpt-3.5-turbo` | `qwen2.5-coder:0.5b` | ⚡⚡⚡ দ্রুততম | ⭐⭐⭐ ভালো |
| `gpt-4` | `qwen2.5-coder:1.5b` | ⚡⚡ মাঝারি | ⭐⭐⭐⭐ চমৎকার |
| `gpt-4-turbo` | `deepseek-r1:1.5b` | ⚡⚡ মাঝারি | ⭐⭐⭐⭐ চমৎকার |
| `gpt-4o` | `qwen2.5-coder:1.5b` | ⚡⚡ মাঝারি | ⭐⭐⭐⭐ চমৎকার |
| `gpt-4o-mini` | `qwen2.5-coder:0.5b` | ⚡⚡⚡ দ্রুততম | ⭐⭐⭐ ভালো |

### Anthropic Models → Real Ollama Models

| Fake Name | Real Ollama Model | Speed | Quality |
|-----------|-------------------|-------|---------|
| `claude-3-opus` | `deepseek-coder:1.3b` | ⚡⚡ মাঝারি | ⭐⭐⭐⭐ চমৎকার |
| `claude-3-sonnet` | `qwen2.5-coder:1.5b` | ⚡⚡ মাঝারি | ⭐⭐⭐⭐ চমৎকার |
| `claude-3-haiku` | `qwen2.5-coder:0.5b` | ⚡⚡⚡ দ্রুততম | ⭐⭐⭐ ভালো |

### Recommended Models

**দ্রুত response এর জন্য**: `gpt-3.5-turbo` বা `gpt-4o-mini`  
**ভালো quality এর জন্য**: `gpt-4` বা `claude-3-sonnet`  
**reasoning এর জন্য**: `gpt-4-turbo`

---

## 🔌 Editor Integration

### VS Code / Cursor / Continue

#### Method 1: OpenAI API Compatible

**settings.json**:
```json
{
  "continue.modelProvider": "openai",
  "continue.apiBase": "http://localhost:5010/v1",
  "continue.model": "gpt-3.5-turbo",
  "continue.apiKey": "sk-dummy-key"
}
```

#### Method 2: Custom Provider

**config.json** (Continue extension):
```json
{
  "models": [
    {
      "title": "ZombieCoder GPT-3.5",
      "provider": "openai",
      "model": "gpt-3.5-turbo",
      "apiBase": "http://localhost:5010/v1",
      "apiKey": "sk-dummy"
    },
    {
      "title": "ZombieCoder GPT-4",
      "provider": "openai",
      "model": "gpt-4",
      "apiBase": "http://localhost:5010/v1",
      "apiKey": "sk-dummy"
    }
  ]
}
```

### Cline / Aider / Other Editors

যেকোনো tool যা OpenAI API support করে:

```bash
# Set environment variables
export OPENAI_API_BASE="http://localhost:5010/v1"
export OPENAI_API_KEY="sk-dummy-key"

# Use with any model name
# The system will automatically map fake names to real models
```

---

## 📊 Available Endpoints

### Backend (Port 8001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/health` | GET | Health check |
| `/v1/chat` | POST | Direct chat (non-streaming) |
| `/v1/chat/stream` | POST | Streaming chat |
| `/v1/chat/ws` | WS | WebSocket connection |
| `/api/models` | GET | Available models |

### Proxy (Port 5010) - OpenAI Compatible

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/chat/completions` | POST | OpenAI-compatible chat |
| `/v1/models` | GET | OpenAI-compatible models list |
| `/proxy/health` | GET | Proxy health check |

### Example Requests

#### 1. OpenAI-Compatible Chat (Non-Streaming)

```bash
curl -X POST http://localhost:5010/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

#### 2. OpenAI-Compatible Chat (Streaming)

```bash
curl -X POST http://localhost:5010/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Count from 1 to 5"}
    ],
    "stream": true
  }'
```

#### 3. Direct Backend Chat

```bash
curl -X POST http://localhost:8001/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a hello world in Python",
    "context": {},
    "model": "qwen2.5-coder:0.5b"
  }'
```

#### 4. Get Available Models

```bash
curl http://localhost:5010/v1/models
```

---

## 🔍 Troubleshooting (সমস্যা সমাধান)

### সমস্যা ১: Backend start হচ্ছে না

**Check করুন**:
```bash
# Port already in use?
netstat -ano | findstr :8001

# Kill process
taskkill /F /PID <PID>
```

**সমাধান**:
- Database re-initialize করুন: `node backend/init-db-fixed.cjs`
- Backend rebuild করুন: `cd backend && npm run build`

---

### সমস্যা ২: "Model not found" error

**Check করুন**:
```bash
# Ollama running কিনা
curl http://localhost:11434/api/tags

# Models list দেখুন
ollama list
```

**সমাধান**:
```bash
# Default model pull করুন
ollama pull qwen2.5-coder:0.5b

# Database re-initialize করুন
node backend/init-db-fixed.cjs
```

---

### সমস্যা ৩: Slow response / Timeout

**কারণ**: Model খুব বড় অথবা hardware slow

**সমাধান**:
```json
// zombiecoder-config.json এ
{
  "models": {
    "default": "qwen2.5-coder:0.5b"  // সবচেয়ে দ্রুত
  },
  "performance": {
    "responseTimeout": 60000,  // 60 seconds
    "streamTimeout": 120000
  }
}
```

অথবা দ্রুত model ব্যবহার করুন:
- `gpt-3.5-turbo` → `qwen2.5-coder:0.5b` (দ্রুততম)
- `gpt-4o-mini` → `qwen2.5-coder:0.5b`

---

### সমস্যা ৪: "Prompt is required" error

**এই সমস্যা ইতিমধ্যে ঠিক করা হয়েছে!**

যদি এখনও দেখা যায়:
- Backend restart করুন
- Latest version আছে কিনা check করুন
- `WEBSOCKET_JSONRPC_FIX.md` দেখুন

---

### সমস্যা ৫: Editor connection failed

**Check করুন**:
```bash
# Backend health
curl http://localhost:8001/v1/health

# Proxy health
curl http://localhost:5010/proxy/health

# WebSocket (should upgrade to websocket)
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost:8001/v1/chat/ws
```

**সমাধান**:
1. Backend এবং Proxy দুটোই running আছে কিনা check করুন
2. Firewall block করছে কিনা check করুন
3. Editor configuration ঠিক আছে কিনা verify করুন

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| `SETUP_GUIDE_BN.md` | এই file - Setup guide |
| `zombiecoder-config.json` | Main configuration |
| `COMPLETE_FIX_SUMMARY.md` | সব fixes এর details |
| `FINAL_SUMMARY_BN.md` | Bengali summary |
| `PROXY_OPENAI_TEST_RESULTS.md` | Test results |
| `WEBSOCKET_JSONRPC_FIX.md` | WebSocket fix details |

---

## 🎯 Performance Tips

### ১. দ্রুত Response এর জন্য

- ✅ `qwen2.5-coder:0.5b` ব্যবহার করুন (default)
- ✅ Fake name: `gpt-3.5-turbo` বা `gpt-4o-mini`
- ✅ Smaller prompts ব্যবহার করুন
- ✅ Context কম দিন

### ২. ভালো Quality এর জন্য

- ✅ `qwen2.5-coder:1.5b` ব্যবহার করুন
- ✅ Fake name: `gpt-4` বা `claude-3-sonnet`
- ✅ Detailed prompts দিন
- ✅ Examples প্রদান করুন

### ৩. Reasoning এর জন্য

- ✅ `deepseek-r1:1.5b` ব্যবহার করুন
- ✅ Fake name: `gpt-4-turbo`
- ✅ Step-by-step thinking request করুন

---

## 🔒 Security & Privacy

### Data Privacy
- ✅ সব data local (no cloud)
- ✅ কোন external API calls নেই
- ✅ SQLite database (local file)
- ✅ সম্পূর্ণ offline কাজ করে

### API Keys
- ✅ Real API key এর প্রয়োজন নেই
- ✅ Fake key (`sk-dummy`) যথেষ্ট
- ✅ Authentication disabled by default

### Network
- ✅ শুধুমাত্র localhost (127.0.0.1)
- ✅ CORS enabled (customize করা যায়)
- ✅ No telemetry, no tracking

---

## 📈 System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk**: 5 GB free
- **OS**: Windows 10/11, Linux, macOS

### Recommended
- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Disk**: 10+ GB free
- **GPU**: Optional (faster inference)

### Model Sizes
- `qwen2.5-coder:0.5b`: ~400 MB (দ্রুততম)
- `qwen2.5-coder:1.5b`: ~1 GB (balanced)
- `deepseek-coder:1.3b`: ~800 MB (coding)
- `deepseek-r1:1.5b`: ~1.1 GB (reasoning)

---

## 🆘 Support & Help

### যদি সমস্যা হয়:

1. **Logs Check করুন**:
   ```bash
   # Backend logs
   type backend\logs\zombiecoder.log
   
   # Real-time logs
   cd backend && npm run dev
   ```

2. **Health Checks**:
   ```bash
   curl http://localhost:8001/v1/health
   curl http://localhost:5010/proxy/health
   curl http://localhost:11434/api/tags
   ```

3. **Database Reset** (যদি প্রয়োজন):
   ```bash
   # Backup old database
   copy zombi.db zombi.db.backup
   
   # Delete and re-initialize
   del zombi.db zombi.db-shm zombi.db-wal
   node backend/init-db-fixed.cjs
   ```

4. **Complete Reset**:
   ```bash
   # Stop all services
   taskkill /F /IM node.exe
   
   # Clean build
   cd backend
   rmdir /s /q dist
   npm run build
   cd ..
   
   # Restart
   start-zombiecoder.bat
   ```

---

## 🎉 Success Indicators

যদি সব কিছু ঠিকঠাক কাজ করে, আপনি দেখবেন:

✅ Backend health check: `{"status":"ok"}`  
✅ Proxy health check: `{"status":"ok"}`  
✅ Models list: 15+ models  
✅ Chat response: Within 1-3 seconds  
✅ Streaming: Chunks coming smoothly  
✅ Fake model names: Working perfectly  

---

## 📞 Quick Reference

### Essential Commands

```bash
# Start everything
start-zombiecoder.bat

# Check health
curl http://localhost:8001/v1/health

# Test chat
curl -X POST http://localhost:5010/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Hi"}]}'

# Stop everything
taskkill /F /IM node.exe

# Restart Ollama
taskkill /F /IM ollama.exe
ollama serve
```

### Ports

- Backend: `8001`
- Proxy: `5010`
- Ollama: `11434`
- Admin: `3002` (optional)
- WebSocket: `3003` (optional)

---

## 🚀 Next Steps

1. ✅ Setup complete করুন
2. ✅ Editor/IDE integrate করুন
3. ✅ Fake model names test করুন
4. ✅ Performance tune করুন
5. ✅ Documentation পড়ুন
6. ✅ Enjoy coding with ZombieCoder! 🧟‍♂️💻

---

**Version**: 2.0.0  
**Last Updated**: February 5, 2026  
**Status**: ✅ Production Ready  
**Language**: Bengali + English  

**আমি ZombieCoder, যেখানে কোড ও কথা বলে। Happy Coding! 🎉**
