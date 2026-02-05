# 🧟‍♂️ ZombieCoder - Local-First AI Code Assistant

<div align="center">

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/zombiecoderbd/Zombie-dance)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

**"যেখানে কোড ও কথা বলে" - Where Code and Speech Converge**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**ZombieCoder** is a privacy-first, local-first AI code assistant ecosystem that provides:

- 🎯 **VS Code Extension** - Intelligent AI assistant integrated into your editor
- 🌐 **Backend Server** - Node.js/Express API with WebSocket streaming
- 🧠 **Multi-LLM Support** - OpenAI, Anthropic Claude, Ollama (local models)
- ⚡ **Zed Editor Support** - Native integration for Zed with local Ollama models
- 🔒 **Privacy Guaranteed** - All processing local, zero telemetry
- 🆓 **Free Forever** - No subscriptions, use your own API keys

### 🎯 Core Philosophy

1. **Local-First**: Your code never leaves your machine unless you explicitly configure cloud APIs
2. **Privacy-Focused**: No telemetry, no tracking, no data collection
3. **Open & Transparent**: Full source code visibility, community-driven
4. **Identity-Anchored**: Creator attribution built into every response
5. **Free & Accessible**: No paywalls, no premium tiers

---

## ✨ Features

### 🤖 AI Capabilities

- **Intelligent Chat** - Natural language code assistance
- **Code Explanation** - Understand complex code instantly
- **Refactoring** - AI-powered code improvements
- **Bug Detection** - Find and fix issues automatically
- **Test Generation** - Create unit tests with AI
- **Semantic Search (RAG)** - Find relevant code using natural language
- **Multi-Language Support** - TypeScript, JavaScript, Python, PHP, and more

### 🔧 Advanced Features

- **Vector Database** - Local embeddings for semantic code search
- **Terminal Safety Layer** - Permission-based command execution
- **WebSocket Streaming** - Real-time AI responses
- **Dance Flow Animation** - Smooth code editing animations
- **Chat History** - Local conversation storage
- **Multi-Provider** - Switch between OpenAI, Claude, Ollama

### 🛡️ Security & Privacy

- ✅ Zero external data transmission (by default)
- ✅ Local-only processing with Ollama
- ✅ Encrypted API key storage
- ✅ Sensitive file exclusion (.env, credentials)
- ✅ Terminal command permission system
- ✅ No telemetry or tracking

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org))
- **VS Code** 1.85+ or **Zed Editor** ([Zed Download](https://zed.dev))
- **Ollama** (optional, for local AI) ([Download](https://ollama.ai))

### Installation

#### Option 1: VS Code Extension

```bash
# Clone the repository
git clone https://github.com/zombiecoderbd/Zombie-dance.git
cd Zombie-dance

# Install dependencies
npm install
# or
pnpm install

# Build extension
cd extension
npm run compile
npm run package

# Install VSIX
code --install-extension dist/zombie-ai-assistant-2.0.0.vsix
```

#### Option 2: Zed Editor (Ollama Local)

```bash
# Navigate to Zed extension
cd zed-zombie

# Run installer
chmod +x install.sh
./install.sh

# Copy configuration
cp config/zed_settings.json ~/.config/zed/settings.json
```

#### Option 3: Backend Server Only

```bash
# Start backend server
cd backend
npm install
npm run dev

# Server runs on http://localhost:8001
```

### Setup Ollama (Free Local AI)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve

# Pull recommended models
ollama pull qwen2.5:1.5b        # 986MB - Best balance
ollama pull qwen2.5:0.5b        # 397MB - Ultra fast
ollama pull nomic-embed-text    # 274MB - Embeddings
```

### First Run

1. **Open VS Code/Zed**
2. **Accept Safety Agreement** (first launch only)
3. **Configure AI Provider** in settings:
   - **Local**: Ollama (free, private)
   - **Cloud**: OpenAI or Anthropic (requires API key)
4. **Start chatting**: Press `Ctrl+Shift+Z`

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Editor Layer (UI)                         │
│         VS Code Extension    |    Zed Integration            │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                  Agent System Layer                          │
│    CoderAgent | TerminalAgent | RAGAgent | Router           │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              Backend API Layer (Node.js)                     │
│    Express REST API | WebSocket Server | SSE Streaming      │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│            Multi-Provider LLM Router                         │
│       OpenAI | Anthropic Claude | Ollama (Local)            │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│          Storage & Security Layer                            │
│    SQLite DB | Vector Store | Identity Manager | ATSL       │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
zombiecoder/
├── extension/              # VS Code Extension
│   ├── src/
│   │   ├── extension.ts           # Entry point
│   │   ├── agents/                # AI agents (Coder, Terminal, RAG)
│   │   ├── services/              # LLM, Context, Diff managers
│   │   ├── vectordb/              # Local vector database
│   │   ├── security/              # Terminal safety, permissions
│   │   └── ui/                    # Webview, sidebar
│   └── package.json
│
├── backend/               # Backend Server
│   ├── src/
│   │   ├── server.ts              # Express + WebSocket server
│   │   ├── routes/                # API routes (chat, admin, models)
│   │   ├── services/              # LLM service, database
│   │   └── utils/                 # Logging, database helpers
│   └── package.json
│
├── zed-zombie/            # Zed Editor Extension
│   ├── src/
│   │   ├── main.js                # Entry point
│   │   ├── lsp_proxy.js           # Language Server Proxy
│   │   └── dap_proxy.js           # Debug Adapter Proxy
│   ├── config/
│   │   └── zed_settings.json      # Zed configuration
│   └── install.sh
│
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md            # System architecture
│   ├── IMPLEMENTATION_STATUS.md   # Current status
│   ├── DEVELOPMENT.md             # Development guide
│   ├── TESTING_GUIDE.md           # Testing procedures
│   ├── INSTALL_WINDOWS.md         # Windows installation
│   ├── INSTALL_LINUX.md           # Linux installation
│   └── TROUBLESHOOTING.md         # Common issues
│
├── temp/                  # Working documents
│   ├── SYSTEM_ARCHITECTURE.md     # Detailed flow diagrams
│   ├── admin_testing_interface.html
│   └── পরিকল্পনা.md               # Development plan (Bangla)
│
├── scripts/               # Build & deployment scripts
│   ├── build-all.sh               # Complete build (Linux/Mac)
│   ├── build-all.bat              # Complete build (Windows)
│   └── package-extension.sh       # VSIX packaging
│
├── zombi.db               # SQLite database
├── package.json           # Root package config
├── docker-compose.yml     # Docker setup
└── README.md              # This file
```

### Core Components

| Component             | Purpose             | Technology                          |
| --------------------- | ------------------- | ----------------------------------- |
| **VS Code Extension** | Editor integration  | TypeScript, VS Code API             |
| **Backend Server**    | API gateway         | Node.js, Express, WebSocket         |
| **Agent System**      | Request routing     | TypeScript, Pattern matching        |
| **Vector DB**         | Semantic search     | Local embeddings, SQLite            |
| **LLM Service**       | AI inference        | OpenAI/Anthropic/Ollama             |
| **Terminal Guard**    | Command safety      | Permission system, Pattern matching |
| **Identity Manager**  | Creator attribution | Cryptographic anchor                |

---

## 📚 Documentation

### 📖 Essential Guides

- **[Quick Start](docs/QUICK_SETUP.md)** - Get running in 5 minutes
- **[Architecture](docs/ARCHITECTURE.md)** - System design and flow
- **[Development Guide](docs/DEVELOPMENT.md)** - How to contribute
- **[Testing Guide](docs/TESTING_GUIDE.md)** - Test procedures
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues

### 🔧 Setup & Installation

- **[Windows Installation](docs/INSTALL_WINDOWS.md)**
- **[Linux Installation](docs/INSTALL_LINUX.md)**
- **[Environment Setup](docs/SETUP_ENVIRONMENT.md)**
- **[VSIX Packaging](docs/VSIX_PACKAGING.md)**

### 🚀 Deployment

- **[Production Guide](PRODUCTION_GUIDE.md)** - Deploy to production
- **[Docker Setup](docker-compose.yml)** - Containerized deployment
- **[Building & Packaging](docs/BUILDING_AND_PACKAGING.md)**

### 📊 Status & Reports

- **[Implementation Status](docs/IMPLEMENTATION_STATUS.md)** - Current progress
- **[Testing Summary](TESTING_SUMMARY.md)** - Test coverage
- **[Final Summary (Bangla)](docs/FINAL_IMPLEMENTATION_SUMMARY_BN.md)**

---

## 🤝 Contributing

### For AI Assistants & Developers

> ⚠️ **Important Guidelines for AI Contributors**

If you're an AI assistant (Claude, GPT, etc.) helping develop this project:

#### ✅ DO:

- **Read documentation first** - Check `/docs` folder before making changes
- **Respect file structure** - Don't move or rename files without reason
- **Follow patterns** - Match existing code style and architecture
- **Ask before major changes** - Explain your reasoning
- **Preserve identity** - Maintain creator attribution in headers
- **Update docs** - Keep documentation in sync with code changes

#### ❌ DON'T:

- **Don't ignore safety warnings** - Security features exist for a reason
- **Don't delete working code** - Understand before removing
- **Don't break the build** - Test before committing
- **Don't override user preferences** - Respect configuration
- **Don't add telemetry** - Privacy is core to this project
- **Don't simplify prematurely** - Complete code > minimal code

#### 🎯 When You Can't Complete a Task:

1. **Explain clearly** what the limitation is
2. **Suggest alternatives** or workarounds
3. **Document** what was attempted
4. **Don't pretend** - Honesty over fake solutions

> "We value honest explanations over broken implementations."

### For Human Developers

#### Development Workflow

```bash
# 1. Fork the repository
git clone https://github.com/zombiecoderbd/Zombie-dance.git
cd Zombie-dance

# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Make changes and test
npm test
npm run lint

# 4. Commit with clear message
git commit -m "feat: Add amazing feature"

# 5. Push and create PR
git push origin feature/amazing-feature
```

#### Commit Message Format

```
<type>: <subject>

<body>

Fixes #<issue-number>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

#### Code Standards

- **TypeScript**: Strict mode, no implicit `any`
- **Testing**: Unit tests for new features
- **Documentation**: JSDoc comments for public APIs
- **Linting**: ESLint + Prettier
- **Security**: No hardcoded secrets, validate inputs

---

## 🔧 Configuration

### VS Code Settings

```json
{
  "zombie.provider": "ollama",
  "zombie.model": "qwen2.5:1.5b",
  "zombie.endpoint": "http://localhost:8001",
  "zombie.enableRAG": true,
  "zombie.contextSizeBytes": 20480
}
```

### Zed Settings

```json
{
  "assistant": {
    "default_model": {
      "provider": "ollama",
      "model": "qwen2.5:1.5b"
    }
  },
  "language_models": {
    "ollama": {
      "api_url": "http://localhost:11434"
    }
  }
}
```

### Environment Variables

```bash
# Backend Server
PORT=8001
NODE_ENV=production
DB_PATH=./zombi.db

# AI Providers (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Ollama (local)
OLLAMA_URL=http://localhost:11434
```

---

## 🐛 Troubleshooting

### Common Issues

#### Backend Connection Failed

```bash
# Check if server is running
curl http://localhost:8001/v1/health

# Start server if not running
cd backend && npm run dev
```

#### Ollama Not Responding

```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve

# Pull model if missing
ollama pull qwen2.5:1.5b
```

#### Extension Not Activating

1. Check VS Code version ≥ 1.85.0
2. Reload window: `Ctrl+Shift+P` → "Reload Window"
3. Check Extension Host output for errors
4. Reinstall extension

See **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** for more solutions.

---

## 📊 Current Status

### ✅ Completed (85%)

- Core architecture implementation
- VS Code extension with chat interface
- Backend server with WebSocket support
- Ollama local LLM integration
- OpenAI & Anthropic support
- RAG semantic search
- Terminal safety layer
- Identity system
- Comprehensive documentation

### 🚧 In Progress (15%)

- Network binding issues resolution
- VSIX packaging automation
- Complete testing coverage
- Production security hardening
- VS Code Marketplace submission

### 🎯 Roadmap

- [ ] JetBrains IDE support
- [ ] Neovim/Vim plugin
- [ ] Advanced debugging integration
- [ ] Team collaboration features
- [ ] Custom model fine-tuning
- [ ] Plugin system for extensibility

---

## 💰 Cost Comparison

| Feature         | GitHub Copilot | Cursor AI  | **ZombieCoder**   |
| --------------- | -------------- | ---------- | ----------------- |
| AI Chat         | ✅ $10/mo      | ✅ $20/mo  | ✅ **FREE**       |
| Code Completion | ✅ $10/mo      | ✅ $20/mo  | ✅ **FREE**       |
| Refactoring     | ✅ $10/mo      | ✅ $20/mo  | ✅ **FREE**       |
| Semantic Search | ❌             | ✅ $20/mo  | ✅ **FREE**       |
| Local Models    | ❌             | ❌         | ✅ **FREE**       |
| Privacy         | ⚠️ Cloud       | ⚠️ Cloud   | ✅ **100% Local** |
| **Total/Month** | **$10-20**     | **$20-40** | **$0** 🎉         |

---

## 📜 License

**MIT License** - Free to use, modify, and distribute.

See [LICENSE](LICENSE) for full details.

---

## 🙏 Acknowledgments

### Creator

**Sahon Srabon**
Developer Zone
Dhaka, Bangladesh 🇧🇩

### Community

- **Ollama** - Free local AI hosting
- **Zed** - Fast, modern editor
- **OpenAI** - GPT models
- **Anthropic** - Claude models
- **VS Code** - Extension platform

### Technologies

- Node.js & Express
- TypeScript
- SQLite & Better-SQLite3
- WebSocket (ws)
- Docker

---

## 📞 Support & Contact

- **GitHub Issues**: [Report bugs](https://github.com/zombiecoderbd/Zombie-dance/issues)
- **Discussions**: [Ask questions](https://github.com/zombiecoderbd/Zombie-dance/discussions)
- **Email**: infi@zombiecoder.my.id
- **Website**: [zombiecoder.my.id](https://zombiecoder.my.id)
- **Phone**: +880 1323-626282

---

## 🌟 Star History

If you find ZombieCoder useful, please consider:

- ⭐ **Starring** the repository
- 🍴 **Forking** for your own use
- 📢 **Sharing** with other developers
- 🐛 **Reporting** bugs you find
- 💡 **Suggesting** new features
- 🤝 **Contributing** code or documentation

---

<div align="center">

## 🧟‍♂️ ZombieCoder

**"যেখানে কোড ও কথা বলে"**
**"Where Code and Speech Converge"**

---

### The Soul of ZombieCoder

> **Identity matters.** Every system deserves accountability.
> **Privacy first.** Your code, your machine, your rules.
> **No tracking.** No telemetry. No corporate surveillance.
> **Local-first.** Works offline. Works your way.
> **Safe by design.** Permissions, not assumptions.
> **Free forever.** No paywalls. No premium tiers.

---

**Made with ❤️ in Bangladesh**

**© 2024 Sahon Srabon | Developer Zone**

[![GitHub Stars](https://img.shields.io/github/stars/zombiecoderbd/Zombie-dance?style=social)](https://github.com/zombiecoderbd/Zombie-dance)
[![GitHub Forks](https://img.shields.io/github/forks/zombiecoderbd/Zombie-dance?style=social)](https://github.com/zombiecoderbd/Zombie-dance)
[![GitHub Issues](https://img.shields.io/github/issues/zombiecoderbd/Zombie-dance)](https://github.com/zombiecoderbd/Zombie-dance/issues)

</div>
