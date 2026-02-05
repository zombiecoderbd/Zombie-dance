# Qoder Editor - ZombieCoder Setup Guide

## 🎯 সংক্ষিপ্ত বিবরণ

Qoder editor এর সাথে ZombieCoder AI Assistant ব্যবহার করার জন্য সম্পূর্ণ গাইড। কোন VPN, কোন internet connection প্রয়োজন নেই - সম্পূর্ণ local!

---

## ⚡ Quick Setup (দ্রুত সেটআপ)

### ধাপ ১: ZombieCoder Backend Start করুন

```bash
cd Zombie-dance
cd backend
npm run dev:all
```

**Expected Output:**
```
[0] 🧟‍♂️ ZombieCoder Backend Server Started
[0] 📍 Server running on: http://0.0.0.0:8001
[1] 🌐 ZombieCoder Proxy Server Started
[1] 📍 Proxy: http://localhost:5010
```

### ধাপ ২: Health Check করুন

```bash
# Backend check
curl http://localhost:8001/v1/health

# Proxy check
curl http://localhost:5010/proxy/health
```

Both should return: `{"status":"ok"}`

---

## 🔧 Qoder Configuration

### Method 1: Settings UI (Recommended)

1. Open **Qoder**
2. Go to: **Preferences** → **Qoder Settings**
3. Navigate to: **AI / LLM Settings**
4. Click: **Add Custom Provider**

### Fill in these settings:

```
┌─ Basic Settings ────────────────────────────────────────┐
│                                                          │
│  Provider Name:    ZombieCoder Local AI                  │
│  Provider Type:    OpenAI                                │
│  API Base URL:     http://localhost:5010/v1              │
│  API Key:          sk-zombiecoder-local                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Network/Proxy Settings (IMPORTANT!):

```
┌─ Network Settings ──────────────────────────────────────┐
│                                                          │
│  Proxy Mode:       No network proxy                      │
│                                                          │
│  OR if "Manual" is selected:                             │
│  Proxy URL:        (leave blank)                         │
│                                                          │
│  Options:                                                │
│  [ ] Use system global configuration                     │
│  [ ] Require VPN                                         │
│  [✓] Allow connections to localhost                     │
│  [✓] Bypass proxy for local addresses                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Model Selection:

```
┌─ Available Models ──────────────────────────────────────┐
│                                                          │
│  Default Model:    gpt-3.5-turbo                         │
│                                                          │
│  Other Models:                                           │
│  • gpt-4          (better quality)                       │
│  • gpt-4-turbo    (reasoning)                            │
│  • gpt-4o         (coding)                               │
│  • gpt-4o-mini    (fast)                                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 📋 Method 2: Configuration File

### Qoder Config Location

**Windows:**
```
%APPDATA%\Qoder\config.json
```

**Mac:**
```
~/Library/Application Support/Qoder/config.json
```

**Linux:**
```
~/.config/Qoder/config.json
```

### Configuration Content:

```json
{
  "llm": {
    "providers": [
      {
        "name": "ZombieCoder Local AI",
        "type": "openai",
        "enabled": true,
        "config": {
          "baseURL": "http://localhost:5010/v1",
          "apiKey": "sk-zombiecoder-local",
          "defaultModel": "gpt-3.5-turbo",
          "models": [
            "gpt-3.5-turbo",
            "gpt-4",
            "gpt-4-turbo",
            "gpt-4o",
            "gpt-4o-mini"
          ]
        },
        "network": {
          "proxy": {
            "mode": "none",
            "url": "",
            "bypassLocal": true
          },
          "ssl": {
            "verify": false,
            "allowSelfSigned": true
          },
          "timeout": 30000,
          "retries": 3
        },
        "advanced": {
          "requireVPN": false,
          "trustLocalhost": true,
          "directConnection": true
        }
      }
    ],
    "defaultProvider": "ZombieCoder Local AI"
  }
}
```

---

## 🚨 Troubleshooting

### Issue 1: "VPN Required" or "Check Internet Connection"

**Problem:** Qoder thinks internet/VPN is needed for localhost

**Solution:**

1. In Qoder Settings → Network:
   - Set Proxy Mode to: **"No network proxy"**
   - Enable: **"Allow connections to localhost"**
   - Enable: **"Bypass proxy for local addresses"**

2. Set Environment Variables (if needed):

**Windows (PowerShell):**
```powershell
$env:NO_PROXY = "localhost,127.0.0.1,::1"
$env:HTTP_PROXY = ""
$env:HTTPS_PROXY = ""

# Start Qoder from this terminal
& "C:\Path\To\Qoder.exe"
```

**Mac/Linux:**
```bash
export NO_PROXY="localhost,127.0.0.1,::1"
export HTTP_PROXY=""
export HTTPS_PROXY=""

# Start Qoder from this terminal
/Applications/Qoder.app/Contents/MacOS/Qoder
```

---

### Issue 2: "Connection Refused" or "ECONNREFUSED"

**Problem:** Backend not running

**Check:**
```bash
curl http://localhost:5010/proxy/health
```

**If fails, start backend:**
```bash
cd Zombie-dance/backend
npm run dev:all
```

---

### Issue 3: Slow Responses

**Problem:** Model taking too long

**Solution 1:** Use faster model
- Change from `gpt-4` to `gpt-3.5-turbo`
- Or use `gpt-4o-mini`

**Solution 2:** Check Ollama
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Check models
ollama list

# Pull fastest model
ollama pull qwen2.5-coder:0.5b
```

---

### Issue 4: "Invalid API Key" or "Unauthorized"

**Problem:** API key validation issue

**Solution:**
- API key can be **anything** (e.g., `sk-local`, `sk-test`, `dummy`)
- Authentication is disabled for local use
- Just make sure it's not empty

---

## 🎯 Model Recommendations

### For Speed (দ্রুত response):
```
Model: gpt-3.5-turbo
→ Maps to: qwen2.5-coder:0.5b
Response Time: 1-2 seconds
```

### For Quality (ভালো quality):
```
Model: gpt-4
→ Maps to: qwen2.5-coder:1.5b
Response Time: 2-4 seconds
```

### For Reasoning (চিন্তাশীল):
```
Model: gpt-4-turbo
→ Maps to: deepseek-r1:1.5b
Response Time: 2-4 seconds
```

### For Coding (কোডিং):
```
Model: gpt-4o
→ Maps to: qwen2.5-coder:1.5b
Response Time: 2-4 seconds
```

---

## 🧪 Quick Test in Qoder

### Test 1: Simple Query

1. Open any code file in Qoder
2. Type in chat: "Write a hello world in Python"
3. Expected: Python code response within 1-2 seconds

### Test 2: Code Explanation

1. Select some code
2. Ask: "Explain this code"
3. Expected: Detailed explanation

### Test 3: Model Switching

1. Try with `gpt-3.5-turbo` (fast)
2. Switch to `gpt-4` (better quality)
3. Compare responses

---

## 📊 All Available Model Names

These fake OpenAI/Anthropic names work in Qoder:

### OpenAI Models
- `gpt-3.5-turbo` → qwen2.5-coder:0.5b ⚡ (Fastest)
- `gpt-3.5-turbo-16k` → qwen2.5-coder:0.5b
- `gpt-4` → qwen2.5-coder:1.5b ⚖️ (Balanced)
- `gpt-4-32k` → qwen2.5-coder:1.5b
- `gpt-4-turbo` → deepseek-r1:1.5b 🧠 (Reasoning)
- `gpt-4-turbo-preview` → deepseek-r1:1.5b
- `gpt-4o` → qwen2.5-coder:1.5b 💻 (Coding)
- `gpt-4o-mini` → qwen2.5-coder:0.5b ⚡ (Fast)

### Anthropic Models
- `claude-3-opus` → deepseek-coder:1.3b
- `claude-3-sonnet` → qwen2.5-coder:1.5b
- `claude-3-haiku` → qwen2.5-coder:0.5b
- `claude-2.1` → qwen2.5-coder:1.5b
- `claude-instant-1` → qwen2.5-coder:0.5b

### Google Models
- `gemini-pro` → gemma2:2b
- `gemini-1.5-pro` → gemma2:2b

---

## 🔍 Verification Checklist

Before using Qoder, verify:

- [ ] Backend running: `curl http://localhost:8001/v1/health`
- [ ] Proxy running: `curl http://localhost:5010/proxy/health`
- [ ] Ollama running: `curl http://localhost:11434/api/tags`
- [ ] Models available: `curl http://localhost:5010/v1/models`
- [ ] Qoder proxy setting: "No network proxy" OR proxy URL blank
- [ ] Qoder network: "Allow localhost" enabled
- [ ] Test query works in Qoder

---

## 💡 Advanced Configuration

### Custom Timeout Settings

If responses are slow, increase timeout:

```json
{
  "llm": {
    "providers": [{
      "network": {
        "timeout": 60000,
        "retries": 5
      }
    }]
  }
}
```

### Custom Model Parameters

Adjust model behavior:

```json
{
  "llm": {
    "providers": [{
      "config": {
        "temperature": 0.7,
        "maxTokens": 4096,
        "topP": 1.0,
        "stream": true
      }
    }]
  }
}
```

---

## 📞 Support & Help

### Get System Status

```bash
# All in one command
curl http://localhost:8001/v1/health && \
curl http://localhost:5010/proxy/health && \
curl http://localhost:11434/api/tags
```

### View Backend Logs

```bash
cd Zombie-dance/backend
# Watch live logs
npm run dev
```

### Restart Everything

```bash
# Kill all processes
taskkill /F /IM node.exe

# Restart
cd Zombie-dance/backend
npm run dev:all
```

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ Backend health check returns `{"status":"ok"}`
2. ✅ Qoder shows "ZombieCoder Local AI" in provider list
3. ✅ No "VPN required" or "internet connection" errors
4. ✅ Responses come within 1-3 seconds
5. ✅ All model names (gpt-4, claude-3, etc.) work
6. ✅ Code suggestions appear in Qoder

---

## 📚 Additional Resources

- **Main Setup Guide:** `SETUP_GUIDE_BN.md`
- **Editor Configs:** `EDITOR_CONFIGS.md`
- **Configuration File:** `qoder-config.json`
- **Complete Documentation:** `DELIVERY_SUMMARY.md`

---

## 🚀 Quick Start Summary

```bash
# 1. Start Backend
cd Zombie-dance/backend
npm run dev:all

# 2. Verify (in new terminal)
curl http://localhost:5010/proxy/health

# 3. Configure Qoder
#    - Provider: OpenAI
#    - URL: http://localhost:5010/v1
#    - Key: sk-local
#    - Proxy: None
#    - Model: gpt-3.5-turbo

# 4. Test in Qoder
#    Ask: "Write hello world in Python"
```

---

**Version:** 2.0.0  
**Last Updated:** February 5, 2026  
**Status:** ✅ Production Ready  
**Editor:** Qoder  

**আমি ZombieCoder, যেখানে কোড ও কথা বলে। Happy Coding! 🧟‍♂️💻**
