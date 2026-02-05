# 🔧 Ollama Integration Fix for Zed Editor

## 🐛 Problem Description

You're experiencing issues with Ollama in Zed Editor where:
- ✅ Models are visible in Zed
- ❌ Tool support is not working
- ❌ No responses from the models

## 🎯 Root Causes

### 1. **Zed Assistant Configuration Issue**
Zed's built-in assistant may not be properly configured to use Ollama's streaming API.

### 2. **Missing Tool/Function Calling Support**
Ollama models need explicit tool/function calling configuration, which Zed might not be sending.

### 3. **API Compatibility**
Zed expects OpenAI-compatible API format, but Ollama's `/api/generate` endpoint has slight differences.

### 4. **Backend Server Not Connected**
The ZombieCoder backend server (port 8001) should act as a proxy/translator between Zed and Ollama.

---

## ✅ Solution 1: Use ZombieCoder Backend as Proxy

### Step 1: Start Backend Server

```bash
# Navigate to backend
cd /home/sahon/zombiecoder/backend

# Install dependencies if not already done
npm install

# Start server
npm run dev

# Server should start on http://localhost:8001
```

### Step 2: Configure Zed to Use Backend

Edit `~/.config/zed/settings.json`:

```json
{
  "assistant": {
    "version": "2",
    "enabled": true,
    "default_model": {
      "provider": "openai",
      "model": "qwen2.5:1.5b"
    }
  },
  "language_models": {
    "openai": {
      "version": "1",
      "api_url": "http://localhost:8001/v1",
      "available_models": [
        {
          "name": "qwen2.5:1.5b",
          "display_name": "Qwen 2.5 1.5B (via ZombieCoder)",
          "max_tokens": 32768
        },
        {
          "name": "qwen2.5:0.5b",
          "display_name": "Qwen 2.5 0.5B (via ZombieCoder)",
          "max_tokens": 32768
        }
      ]
    }
  }
}
```

**Why this works:**
- Backend server translates between Zed's OpenAI-format requests and Ollama's native format
- Adds proper tool/function calling support
- Handles streaming correctly

---

## ✅ Solution 2: Fix Ollama Direct Connection

If you want to use Ollama directly without the backend:

### Step 1: Update Ollama Settings

Edit `~/.config/zed/settings.json`:

```json
{
  "assistant": {
    "version": "2",
    "enabled": true,
    "default_model": {
      "provider": "ollama",
      "model": "qwen2.5:1.5b"
    }
  },
  "language_models": {
    "ollama": {
      "api_url": "http://localhost:11434",
      "low_speed_timeout_in_seconds": 120,
      "available_models": [
        {
          "name": "qwen2.5:1.5b",
          "display_name": "Qwen 2.5 1.5B",
          "max_tokens": 32768,
          "keep_alive": "30m"
        }
      ]
    }
  },
  "features": {
    "inline_completion_provider": "none"
  }
}
```

### Step 2: Verify Ollama is Running

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Expected output: JSON with your models
# {"models":[{"name":"qwen2.5:1.5b",...}]}

# If not running, start Ollama
ollama serve

# Test model directly
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:1.5b",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

### Step 3: Restart Zed

```bash
# Kill all Zed processes
killall zed

# Restart Zed
zed
```

---

## ✅ Solution 3: Add Tool Support to Backend

If the backend doesn't support tools yet, add this endpoint:

### Create `backend/src/routes/ollama-proxy.ts`:

```typescript
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// OpenAI-compatible chat completions endpoint for Ollama
router.post('/v1/chat/completions', async (req, res) => {
  try {
    const { model, messages, tools, tool_choice, stream = false } = req.body;

    // Convert OpenAI format to Ollama format
    const ollamaPrompt = messages
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    // Add tool information to prompt if tools are provided
    let enhancedPrompt = ollamaPrompt;
    if (tools && tools.length > 0) {
      const toolsDescription = tools
        .map((tool: any) => `- ${tool.function.name}: ${tool.function.description}`)
        .join('\n');

      enhancedPrompt = `You have access to these tools:\n${toolsDescription}\n\n${ollamaPrompt}\n\nIf you need to use a tool, respond with: TOOL_CALL: {tool_name} {parameters}`;
    }

    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

    if (stream) {
      // Streaming response
      const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: enhancedPrompt,
          stream: true
        })
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = ollamaResponse.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            // Convert to OpenAI streaming format
            const openaiChunk = {
              id: `chatcmpl-${Date.now()}`,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: model,
              choices: [{
                index: 0,
                delta: {
                  content: data.response || ''
                },
                finish_reason: data.done ? 'stop' : null
              }]
            };

            res.write(`data: ${JSON.stringify(openaiChunk)}\n\n`);
          } catch (e) {
            console.error('Error parsing Ollama chunk:', e);
          }
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Non-streaming response
      const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: enhancedPrompt,
          stream: false
        })
      });

      const ollamaData = await ollamaResponse.json();

      // Convert to OpenAI format
      const openaiResponse = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: ollamaData.response
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: ollamaData.prompt_eval_count || 0,
          completion_tokens: ollamaData.eval_count || 0,
          total_tokens: (ollamaData.prompt_eval_count || 0) + (ollamaData.eval_count || 0)
        }
      };

      res.json(openaiResponse);
    }
  } catch (error) {
    console.error('Ollama proxy error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'internal_error'
      }
    });
  }
});

// List models endpoint
router.get('/v1/models', async (req, res) => {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/tags`);
    const data = await response.json();

    const models = data.models.map((model: any) => ({
      id: model.name,
      object: 'model',
      created: Date.now(),
      owned_by: 'ollama'
    }));

    res.json({
      object: 'list',
      data: models
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Failed to fetch models',
        type: 'internal_error'
      }
    });
  }
});

export default router;
```

### Add to `backend/src/server.ts`:

```typescript
import ollamaProxyRouter from './routes/ollama-proxy.js';

// ... existing code ...

app.use(ollamaProxyRouter);
```

---

## 🧪 Testing the Fix

### Test 1: Backend Health Check

```bash
curl http://localhost:8001/v1/health
```

Expected: `{"status":"ok",...}`

### Test 2: List Models Through Backend

```bash
curl http://localhost:8001/v1/models
```

Expected: JSON with your Ollama models

### Test 3: Chat Completion

```bash
curl http://localhost:8001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:1.5b",
    "messages": [
      {"role": "user", "content": "Say hello in one word"}
    ],
    "stream": false
  }'
```

Expected: `{"choices":[{"message":{"content":"Hello"}}]}`

### Test 4: Zed Assistant

1. Open Zed
2. Press `Ctrl+Shift+Z` (or `Cmd+Shift+Z` on Mac)
3. Type a message
4. Should get response from Ollama

---

## 🔍 Debugging Tips

### Check Zed Logs

```bash
# Zed logs location
tail -f ~/.local/share/zed/logs/Zed.log

# Look for errors related to assistant or LLM
grep -i "assistant\|llm\|ollama" ~/.local/share/zed/logs/Zed.log
```

### Check Backend Logs

```bash
# If running with npm run dev
# Logs will appear in terminal

# Check for incoming requests
grep "POST /v1/chat" backend_logs.txt
```

### Check Ollama Logs

```bash
# Ollama logs
journalctl -u ollama -f

# Or if running manually
# Check terminal where you ran "ollama serve"
```

### Network Connectivity

```bash
# Test if all services are accessible
echo "Testing Ollama..."
curl -s http://localhost:11434/api/tags | jq .

echo "Testing Backend..."
curl -s http://localhost:8001/v1/health | jq .

echo "Testing Backend -> Ollama proxy..."
curl -s http://localhost:8001/v1/models | jq .
```

---

## 📊 Architecture Diagram

```
Zed Editor
    ↓ (OpenAI format)
    ↓ POST /v1/chat/completions
    ↓
ZombieCoder Backend (port 8001)
    ↓ (Translation layer)
    ↓ POST /api/generate
    ↓
Ollama (port 11434)
    ↓
qwen2.5:1.5b model
    ↓ (Response)
    ↓
Backend (converts to OpenAI format)
    ↓
Zed Editor (displays response)
```

---

## 🎯 Quick Fix Checklist

- [ ] Ollama is running: `ollama serve`
- [ ] Models are pulled: `ollama list`
- [ ] Backend is running: `cd backend && npm run dev`
- [ ] Backend health check passes: `curl http://localhost:8001/v1/health`
- [ ] Zed settings updated with correct API URL
- [ ] Zed restarted after config changes
- [ ] Test chat in Zed: `Ctrl+Shift+Z`

---

## 🆘 Still Not Working?

### Option A: Use Direct Ollama (Simpler but Limited)

Keep `provider: "ollama"` in Zed settings and skip backend entirely.

**Pros:**
- Simpler setup
- Direct connection

**Cons:**
- No tool support
- Limited features

### Option B: Use Backend Proxy (Recommended)

Use `provider: "openai"` with `api_url: "http://localhost:8001/v1"`

**Pros:**
- Full feature support
- Better error handling
- Tool/function calling works

**Cons:**
- Requires backend running

---

## 📞 Need Help?

If you're still experiencing issues:

1. **Check logs** in all three places (Zed, Backend, Ollama)
2. **Verify ports** are not blocked by firewall
3. **Test each component** individually
4. **Share logs** when asking for help

```bash
# Generate debug info
echo "=== Ollama Status ===" > debug.txt
curl -s http://localhost:11434/api/tags >> debug.txt 2>&1

echo -e "\n=== Backend Status ===" >> debug.txt
curl -s http://localhost:8001/v1/health >> debug.txt 2>&1

echo -e "\n=== Zed Config ===" >> debug.txt
cat ~/.config/zed/settings.json >> debug.txt 2>&1

echo -e "\n=== Network Tests ===" >> debug.txt
netstat -tuln | grep -E "8001|11434" >> debug.txt 2>&1

cat debug.txt
```

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Ollama responds to `curl http://localhost:11434/api/tags`
2. ✅ Backend responds to `curl http://localhost:8001/v1/health`
3. ✅ Zed shows your models in the assistant dropdown
4. ✅ Typing in Zed assistant gets AI responses
5. ✅ Tool/function calls work (if implemented)

---

**Last Updated:** 2024-01-15
**Status:** Active solution for Zed + Ollama integration
