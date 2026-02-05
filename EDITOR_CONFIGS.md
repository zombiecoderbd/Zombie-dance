# Editor Configuration Guide - ZombieCoder AI Assistant

## 🎯 Overview

This guide provides configuration for various AI-powered editors to connect to your local ZombieCoder backend. No VPN, no internet connection, completely local!

---

## 🔧 Qoder Configuration

### Method 1: Settings UI

1. Open Qoder Settings
2. Navigate to: **AI Provider Settings**
3. Add Custom Provider with these settings:

```
Provider Name: ZombieCoder Local
Provider Type: OpenAI Compatible
API Base URL: http://localhost:5010/v1
API Key: sk-zombiecoder-local
```

4. **Network Settings** (Important!):
   - ❌ Disable "Use System Proxy"
   - ❌ Disable "Require VPN"
   - ✅ Enable "Allow Localhost"
   - ✅ Enable "Bypass Proxy for Local"

5. **Model Selection**:
   - Fast: `gpt-3.5-turbo` or `gpt-4o-mini`
   - Balanced: `gpt-4`
   - Best: `gpt-4-turbo`

### Method 2: Configuration File

**Location**: `~/.qoder/config.json` or Qoder settings folder

```json
{
  "aiProviders": [
    {
      "name": "ZombieCoder Local",
      "type": "openai",
      "baseURL": "http://localhost:5010/v1",
      "apiKey": "sk-zombiecoder-local",
      "enabled": true,
      "models": [
        "gpt-3.5-turbo",
        "gpt-4",
        "gpt-4-turbo",
        "gpt-4o",
        "gpt-4o-mini"
      ],
      "defaultModel": "gpt-3.5-turbo",
      "network": {
        "useProxy": false,
        "bypassProxyForLocalhost": true,
        "requireVPN": false,
        "allowInsecure": true,
        "timeout": 30000
      }
    }
  ],
  "defaultProvider": "ZombieCoder Local"
}
```

### Method 3: Environment Variables

Add to your system environment or `.env` file:

```bash
QODER_API_BASE=http://localhost:5010/v1
QODER_API_KEY=sk-zombiecoder-local
QODER_MODEL=gpt-3.5-turbo
NO_PROXY=localhost,127.0.0.1
```

---

## 💻 VS Code / Cursor / Continue

### Continue Extension Configuration

**File**: `~/.continue/config.json`

```json
{
  "models": [
    {
      "title": "ZombieCoder Fast",
      "provider": "openai",
      "model": "gpt-3.5-turbo",
      "apiBase": "http://localhost:5010/v1",
      "apiKey": "sk-zombiecoder-local"
    },
    {
      "title": "ZombieCoder Balanced",
      "provider": "openai",
      "model": "gpt-4",
      "apiBase": "http://localhost:5010/v1",
      "apiKey": "sk-zombiecoder-local"
    },
    {
      "title": "ZombieCoder Reasoning",
      "provider": "openai",
      "model": "gpt-4-turbo",
      "apiBase": "http://localhost:5010/v1",
      "apiKey": "sk-zombiecoder-local"
    }
  ],
  "tabAutocompleteModel": {
    "title": "ZombieCoder Fast",
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "apiBase": "http://localhost:5010/v1",
    "apiKey": "sk-zombiecoder-local"
  },
  "embeddingsProvider": {
    "provider": "openai",
    "model": "nomic-embed-text",
    "apiBase": "http://localhost:5010/v1",
    "apiKey": "sk-zombiecoder-local"
  }
}
```

### VS Code Settings (settings.json)

**File**: `.vscode/settings.json` or User Settings

```json
{
  "continue.telemetryEnabled": false,
  "continue.enableTabAutocomplete": true,
  "ai.openai.endpoint": "http://localhost:5010/v1",
  "ai.openai.key": "sk-zombiecoder-local",
  "ai.openai.model": "gpt-3.5-turbo",
  "http.proxySupport": "off",
  "http.proxy": "",
  "http.proxyStrictSSL": false
}
```

---

## 🎨 Cline Configuration

**File**: VS Code Settings or Cline extension settings

```json
{
  "cline.apiProvider": "openai",
  "cline.openaiBaseUrl": "http://localhost:5010/v1",
  "cline.openaiApiKey": "sk-zombiecoder-local",
  "cline.openaiModelId": "gpt-4",
  "cline.maxTokens": 4096,
  "cline.temperature": 0.7
}
```

---

## 🛠️ Aider (CLI Tool)

### Command Line Usage

```bash
# Set environment variables
export OPENAI_API_BASE=http://localhost:5010/v1
export OPENAI_API_KEY=sk-zombiecoder-local

# Run aider
aider --model gpt-3.5-turbo

# Or specify directly
aider \
  --openai-api-base http://localhost:5010/v1 \
  --openai-api-key sk-zombiecoder-local \
  --model gpt-3.5-turbo
```

### Config File

**File**: `~/.aider.conf.yml`

```yaml
openai-api-base: http://localhost:5010/v1
openai-api-key: sk-zombiecoder-local
model: gpt-3.5-turbo
no-auto-commits: false
no-pretty: false
dark-mode: true
```

---

## 🤖 ChatGPT Desktop / OpenAI Compatible Apps

### Generic OpenAI Client Configuration

Most OpenAI-compatible clients support these settings:

```
API Endpoint: http://localhost:5010/v1
API Key: sk-zombiecoder-local (any dummy key works)
Model: gpt-3.5-turbo (or any from the list below)
Organization ID: (leave empty)
Project ID: (leave empty)
```

---

## 📋 Available Model Names

All these fake names work and map to local Ollama models:

### OpenAI Models
- `gpt-3.5-turbo` → qwen2.5-coder:0.5b (⚡ Fastest)
- `gpt-4` → qwen2.5-coder:1.5b (⚖️ Balanced)
- `gpt-4-turbo` → deepseek-r1:1.5b (🧠 Reasoning)
- `gpt-4o` → qwen2.5-coder:1.5b (💻 Coding)
- `gpt-4o-mini` → qwen2.5-coder:0.5b (⚡ Fast)

### Anthropic Models
- `claude-3-opus` → deepseek-coder:1.3b
- `claude-3-sonnet` → qwen2.5-coder:1.5b
- `claude-3-haiku` → qwen2.5-coder:0.5b

### Google Models
- `gemini-pro` → gemma2:2b
- `gemini-1.5-pro` → gemma2:2b

**Recommendation**: Use `gpt-3.5-turbo` for fastest responses!

---

## 🔍 Troubleshooting VPN/Proxy Issues

### Issue: "VPN Required" or "Check Internet Connection"

**Solution 1: Disable Proxy in Editor**

Add these settings to your editor config:

```json
{
  "http.proxy": "",
  "http.proxySupport": "off",
  "http.proxyStrictSSL": false,
  "NO_PROXY": "localhost,127.0.0.1,::1"
}
```

**Solution 2: System Environment Variables**

Windows (PowerShell):
```powershell
$env:NO_PROXY = "localhost,127.0.0.1,::1"
$env:HTTP_PROXY = ""
$env:HTTPS_PROXY = ""
```

Linux/Mac:
```bash
export NO_PROXY="localhost,127.0.0.1,::1"
export HTTP_PROXY=""
export HTTPS_PROXY=""
```

**Solution 3: Add to Editor's Launch Config**

For VS Code (`launch.json`):
```json
{
  "env": {
    "NO_PROXY": "localhost,127.0.0.1",
    "HTTP_PROXY": "",
    "HTTPS_PROXY": ""
  }
}
```

### Issue: "Connection Refused" or "ECONNREFUSED"

**Check if backend is running:**
```bash
curl http://localhost:5010/proxy/health
curl http://localhost:8001/v1/health
```

**Expected Response:**
```json
{"status":"ok"}
```

If not working:
```bash
# Restart backend
cd backend
npm run build
npm run dev
```

### Issue: Slow Responses

**Solution**: Use faster model
- Change from `gpt-4` to `gpt-3.5-turbo`
- Or use `gpt-4o-mini`

**Check Ollama:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Check loaded models
ollama list

# Pull faster model if needed
ollama pull qwen2.5-coder:0.5b
```

---

## 🧪 Quick Test

### Test 1: Health Check

```bash
curl http://localhost:5010/proxy/health
```

Expected: `{"status":"ok"}`

### Test 2: Models List

```bash
curl http://localhost:5010/v1/models
```

Expected: JSON list with gpt-3.5-turbo, gpt-4, etc.

### Test 3: Simple Chat

```bash
curl -X POST http://localhost:5010/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Say hi"}]
  }'
```

Expected: JSON response with AI message

---

## 📊 Network Configuration Reference

### Proxy Settings to DISABLE

For local ZombieCoder, disable these:

```json
{
  "http.proxy": "",
  "http.proxySupport": "off",
  "http.proxyStrictSSL": false,
  "network.proxy.enabled": false,
  "network.proxy.useSystemProxy": false,
  "vpn.required": false,
  "vpn.enabled": false
}
```

### Environment Variables to SET

```bash
# Bypass proxy for localhost
NO_PROXY=localhost,127.0.0.1,::1,*.local

# Clear proxy settings
HTTP_PROXY=
HTTPS_PROXY=
ALL_PROXY=

# Trust localhost
NODE_TLS_REJECT_UNAUTHORIZED=0
```

---

## 🎯 Complete Working Example for Qoder

### Step-by-Step Setup

1. **Start ZombieCoder Backend**
   ```bash
   cd Zombie-dance
   start-zombiecoder.bat
   ```

2. **Verify Backend is Running**
   ```bash
   curl http://localhost:5010/proxy/health
   ```

3. **Configure Qoder**
   
   Open Qoder → Settings → AI Providers → Add Custom Provider:
   
   ```
   Name: ZombieCoder
   Type: OpenAI
   Base URL: http://localhost:5010/v1
   API Key: sk-local
   
   Network Settings:
   [✓] Trust Localhost
   [✓] Bypass Proxy
   [ ] Require VPN
   [ ] Use System Proxy
   ```

4. **Select Model**
   
   Choose: `gpt-3.5-turbo` (fastest)

5. **Test in Qoder**
   
   Type: "Write a hello world in Python"
   
   Expected: Code response within 1-2 seconds

---

## 🆘 Still Having Issues?

### Debug Checklist

- [ ] Backend running? (`curl http://localhost:8001/v1/health`)
- [ ] Proxy running? (`curl http://localhost:5010/proxy/health`)
- [ ] Ollama running? (`curl http://localhost:11434/api/tags`)
- [ ] Model pulled? (`ollama list` shows qwen2.5-coder:0.5b)
- [ ] Proxy disabled in editor settings?
- [ ] NO_PROXY environment variable set?
- [ ] Firewall not blocking localhost?
- [ ] Using correct URL: `http://localhost:5010/v1`

### Get Detailed Logs

Backend logs:
```bash
cd backend
npm run dev
# Watch console output
```

Test with verbose curl:
```bash
curl -v http://localhost:5010/v1/models
```

---

## 📞 Quick Reference

| Setting | Value |
|---------|-------|
| API Base | `http://localhost:5010/v1` |
| API Key | Any (e.g., `sk-local`) |
| Fast Model | `gpt-3.5-turbo` |
| Best Model | `gpt-4` |
| Proxy | OFF/Disabled |
| VPN | Not Required |
| SSL Verify | Disabled |

---

## ✅ Success Indicators

You know it's working when:

1. ✅ Health check returns `{"status":"ok"}`
2. ✅ Models list shows `gpt-3.5-turbo`, `gpt-4`, etc.
3. ✅ Chat request returns AI response within seconds
4. ✅ No VPN error messages
5. ✅ No proxy/connection errors

---

**Version**: 2.0.0  
**Last Updated**: February 5, 2026  
**Status**: Production Ready  

**Happy Coding with ZombieCoder! 🧟‍♂️💻**
