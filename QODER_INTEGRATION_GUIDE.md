# Qoder Editor Integration Guide

## 🎯 Overview
This guide explains how to configure Qoder editor to work with the ZombieCoder proxy server.

## 🚀 Quick Setup

### Method 1: Environment Variables (Recommended)
Add these to your Qoder environment or `.env` file:

```bash
OPENAI_BASE_URL=http://localhost:5010/v1
OPENAI_API_KEY=your-api-key-here
```

### Method 2: Manual Proxy Configuration
In Qoder Settings:
1. Go to **Plugin Settings** → **HTTP Proxy Settings**
2. Select **Set up a network proxy manually**
3. Enter: `http://localhost:5010`
4. Select **HTTP** proxy type

### Method 3: System Proxy (Windows)
1. Go to Windows Settings → Network & Internet → Proxy
2. Set proxy to: `localhost:5010`
3. Qoder will automatically use system proxy settings

## 🧪 Testing the Connection

### Using the Test Scripts
```bash
# Node.js test
node test-qoder-integration.js

# PowerShell test (Windows)
powershell -ExecutionPolicy Bypass -File test-qoder-integration.ps1
```

### Manual Testing
```bash
# Health check
curl http://localhost:5010/proxy/health

# Qoder configuration
curl http://localhost:5010/proxy/qoder-config

# Chat test
curl -X POST http://localhost:5010/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"modelId":6}'
```

## 🔧 Configuration Details

### Proxy Server Information
- **Proxy URL**: `http://localhost:5010`
- **Backend**: `http://localhost:8001`
- **Supported Models**: Qwen2.5-Coder and other Ollama models

### API Endpoints
- **Chat**: `/v1/chat`
- **Models**: `/api/models`
- **Health**: `/proxy/health`
- **Qoder Config**: `/proxy/qoder-config`

### Headers Support
The proxy supports all standard headers including:
- `Content-Type`
- `Authorization`
- `User-Agent`
- `Origin`
- And many more...

## 📋 Supported Features

✅ **OpenAI-Compatible API**
✅ **CORS for Web Editors**
✅ **WebSocket Support**
✅ **Multiple Model Support**
✅ **Health Monitoring**
✅ **Qoder-Specific Configuration**

## 🔍 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure proxy server is running on port 5010
   - Check if port is blocked by firewall

2. **CORS Errors**
   - Our proxy allows all origins including Qoder domains
   - Should work out of the box

3. **Authentication Issues**
   - Make sure API key is properly configured
   - Check if backend server is accessible

### Debug Information
Check the proxy logs for detailed information:
```bash
# Proxy logs show:
# - Request origins
# - Forwarded headers
# - Response status codes
# - Error details
```

## 🎯 Qoder-Specific Features

Our proxy now includes:
- **Dedicated Qoder configuration endpoint** (`/proxy/qoder-config`)
- **Qoder domain support** in CORS configuration
- **Pre-configured environment variables** for easy setup
- **Comprehensive testing scripts** for verification

## 📞 Support

If you encounter any issues:
1. Run the test scripts to verify connectivity
2. Check the proxy server logs
3. Verify Qoder configuration settings
4. Ensure all required services are running

The integration should work seamlessly with Qoder's editor once properly configured!