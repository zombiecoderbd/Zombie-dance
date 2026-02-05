# 🧟 ZombieCoder Backend Server

> Backend API server for ZombieCoder AI Assistant with multi-model support, streaming chat, and VS Code integration.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- 🤖 **Multi-Model Support** - Switch between 15+ Ollama models
- 💬 **Streaming Chat** - Real-time responses using Server-Sent Events (SSE)
- 🌐 **WebSocket Support** - Persistent connections for interactive chat
- 💾 **SQLite Database** - Full schema for users, sessions, and messages
- 🔌 **VS Code Integration** - Ready for VS Code extension
- 📊 **Comprehensive Logging** - Structured logs with Pino
- 🛡️ **Error Handling** - Graceful error handling throughout
- 🔒 **CORS Configured** - Development-friendly CORS setup
- 📈 **Health Monitoring** - Multiple health check endpoints
- 🚀 **Production Ready** - Optimized for deployment

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20.x or higher)
- **npm** (comes with Node.js)
- **Ollama** (for AI model support)
  - Install: [https://ollama.ai/](https://ollama.ai/)
  - Make sure Ollama is running: `ollama serve`
  - Pull some models: `ollama pull qwen2.5-coder:1.5b`

## 🚀 Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install type definitions:**
   ```bash
   npm install --save-dev @types/better-sqlite3
   ```

4. **Rebuild native dependencies (if needed):**
   ```bash
   npm rebuild better-sqlite3
   ```

## ⚙️ Configuration

1. **Create environment file:**
   
   The `.env` file should already exist in the backend directory with the following configuration:

   ```env
   # Server Configuration
   PORT=8001
   NODE_ENV=development

   # Database Configuration
   DATABASE_URL=sqlite:./zombi.db

   # Ollama Configuration
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_TIMEOUT=120000

   # OpenAI Configuration (Optional)
   OPENAI_API_KEY=

   # Security
   JWT_SECRET=zombiecoder-jwt-secret-key-change-in-production
   ADMIN_PASSWORD=admin123

   # Logging
   LOG_LEVEL=info
   LOG_PRETTY=true

   # CORS
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000

   # VS Code Integration
   VSCODE_SESSION_TIMEOUT=3600000

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

2. **Update configuration (optional):**
   - Change `PORT` if 8001 is already in use
   - Update `OLLAMA_HOST` if Ollama is on a different machine
   - Set `OPENAI_API_KEY` if you want to use OpenAI models

## 💾 Database Setup

### Initialize Database

Run the database initialization script to create tables and import Ollama models:

```bash
npm run init-db
```

This will:
- ✅ Create all database tables
- ✅ Import available Ollama models
- ✅ Create default admin user
- ✅ Add sample data
- ✅ Verify database integrity

### Database Schema

The database includes the following tables:

- `users` - System users and admins
- `model_configs` - AI model configurations
- `user_preferences` - User settings
- `chat_sessions` - Conversation containers
- `chat_messages` - Individual messages
- `activity_log` - System activity tracking
- `system_metrics` - Performance statistics
- `vscode_sessions` - VS Code integration data
- `code_embeddings` - Code snippets for RAG

## 🏃 Running the Server

### Development Mode (with hot reload)

```bash
npm run dev
```

The server will start on `http://localhost:8001` with auto-reload enabled.

### Production Mode

```bash
# Build the TypeScript code
npm run build

# Start the server
npm start
```

### Verify Server is Running

Open your browser and visit:
- Health Check: http://localhost:8001/v1/health
- Test Endpoint: http://localhost:8001/test
- VS Code Info: http://localhost:8001/v1/vscode/info

## 📚 API Documentation

### Health & Status Endpoints

#### GET /v1/health
Health check endpoint with server information.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 123.456,
  "server": "ZombieCoder Backend",
  "version": "2.0.0",
  "websocket": {
    "enabled": true,
    "activeConnections": 0
  }
}
```

#### GET /v1/vscode/info
VS Code extension information.

#### GET /v1/runtime_status
Comprehensive runtime status including system resources, services, and models.

#### GET /v1/runtime_agent
Runtime agent information and capabilities.

### Model Endpoints

#### GET /api/models
Get all configured models.

**Response:**
```json
{
  "models": [...],
  "total": 15,
  "active": 15
}
```

#### GET /v1/chat/models
Get active models available for chat.

**Response:**
```json
[
  {
    "id": 1,
    "name": "qwen2.5-coder:1.5b",
    "displayName": "Qwen 2.5 Coder 1.5B",
    "provider": "ollama",
    "isActive": true,
    "isDefault": true
  }
]
```

#### POST /api/models
Create a new model configuration.

**Request Body:**
```json
{
  "name": "gpt-4",
  "displayName": "GPT-4",
  "provider": "openai",
  "modelId": "gpt-4",
  "endpointUrl": "https://api.openai.com/v1",
  "maxTokens": 8192,
  "temperature": 0.7
}
```

#### PUT /api/models/:id
Update model configuration.

#### DELETE /api/models/:id
Delete a model configuration.

### Chat Endpoints

#### POST /v1/chat
Basic chat endpoint (non-streaming).

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is React?"
    }
  ],
  "modelId": 1,
  "stream": false
}
```

**Response:**
```json
{
  "id": "chat-123",
  "model": "qwen2.5-coder:1.5b",
  "message": {
    "role": "assistant",
    "content": "React is a JavaScript library..."
  },
  "usage": {
    "promptTokens": 10,
    "completionTokens": 50,
    "totalTokens": 60
  }
}
```

#### POST /v1/chat/stream
Streaming chat endpoint (SSE).

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Explain async/await"
    }
  ],
  "modelId": 1,
  "stream": true
}
```

**Response:** Server-Sent Events stream
```
data: {"content": "Async"}
data: {"content": "/await"}
data: {"content": " is a"}
...
data: [DONE]
```

#### WebSocket: ws://localhost:8001/v1/chat/ws
WebSocket endpoint for persistent chat connections.

**Message Format:**
```json
{
  "type": "chat",
  "data": {
    "messages": [
      {
        "role": "user",
        "content": "Hello"
      }
    ],
    "modelId": 1
  }
}
```

## 🧪 Testing

### Web-Based Testing Interface

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open test interface:**
   - Navigate to `../temp/backend-test.html`
   - Open in your browser
   - Test all endpoints interactively

### cURL Testing

```bash
# Health check
curl http://localhost:8001/v1/health

# Get models
curl http://localhost:8001/api/models

# Basic chat
curl -X POST http://localhost:8001/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "modelId": 1,
    "stream": false
  }'

# Streaming chat
curl -X POST http://localhost:8001/v1/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "modelId": 1,
    "stream": true
  }'
```

### WebSocket Testing

Use the provided HTML test interface or a WebSocket client:

```javascript
const ws = new WebSocket('ws://localhost:8001/v1/chat/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'chat',
    data: {
      messages: [{ role: 'user', content: 'Hello' }],
      modelId: 1
    }
  }));
};

ws.onmessage = (event) => {
  console.log('Received:', event.data);
};
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.ts                 # Main server entry point
│   ├── routes/
│   │   ├── chat.ts              # Chat endpoints
│   │   ├── admin.ts             # Admin/models endpoints
│   │   └── websocket.ts         # WebSocket handlers
│   ├── services/
│   │   ├── llmService.ts        # LLM integration
│   │   └── diffService.ts       # Code diff service
│   ├── utils/
│   │   ├── database.ts          # Database manager
│   │   ├── logger.ts            # Logging utility
│   │   └── initDatabase.ts      # DB initialization
│   ├── scripts/
│   │   └── initDb.ts            # CLI init script
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── middleware/              # Express middleware
├── .env                          # Environment variables
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

## 💻 Development

### NPM Scripts

```bash
npm run dev        # Start dev server with hot reload
npm run build      # Build TypeScript to JavaScript
npm start          # Start production server
npm run init-db    # Initialize/reset database
npm run test       # Run tests
npm run lint       # Lint code
```

### Adding a New Endpoint

1. Create route handler in `src/routes/`
2. Add types in `src/types/index.ts`
3. Update router in `src/server.ts`
4. Test with cURL or test interface

### Adding a New Model Provider

1. Update `src/services/llmService.ts`
2. Add provider type to database schema
3. Update model configuration endpoints
4. Test with new provider

## 🚀 Production Deployment

### Security Checklist

- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Update `ADMIN_PASSWORD` to a strong password
- [ ] Configure proper `ALLOWED_ORIGINS` for CORS
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Set up proper logging
- [ ] Configure rate limiting
- [ ] Set up monitoring

### Docker Deployment (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8001
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=8001
DATABASE_URL=sqlite:./zombi.db
OLLAMA_HOST=http://ollama:11434
JWT_SECRET=<generate-secure-secret>
ADMIN_PASSWORD=<secure-password>
LOG_LEVEL=warn
LOG_PRETTY=false
ALLOWED_ORIGINS=https://yourdomain.com
```

## 🔧 Troubleshooting

### Server won't start

**Check Ollama is running:**
```bash
curl http://localhost:11434/api/tags
```

**Check port availability:**
```bash
netstat -an | grep 8001
```

### Database errors

**Reinitialize database:**
```bash
npm run init-db
```

**Check database file permissions:**
```bash
ls -la ../zombi.db
```

### Model import fails

**Verify Ollama connection:**
```bash
curl http://localhost:11434/api/tags
```

**Check available models:**
```bash
ollama list
```

**Pull a model if needed:**
```bash
ollama pull qwen2.5-coder:1.5b
```

### WebSocket connection issues

- Check firewall settings
- Verify CORS configuration
- Check browser console for errors
- Try different browser

## 📞 Support

For issues, questions, or contributions:

- GitHub: [ZombieCoder Repository]
- Email: admin@zombiecoder.dev
- Documentation: [Project Wiki]

## 📄 License

MIT License - see LICENSE file for details

---

**Made with 🧟 by ZombieCoder Team**
