# 🧟 ZombieCoder for Zed Editor

> গরিবদের জন্য ফ্রি AI - Free AI for Everyone!

**ZombieCoder** হলো Zed এডিটরের জন্য একটি এক্সটেনশন যা আপনাকে **ফ্রি লোকাল AI মডেল** (Ollama) ব্যবহার করে কোডিং করতে সাহায্য করবে। আর কোনো ব্যয়বহুল API subscription দরকার নেই!

---

## 📑 Table of Contents / সূচিপত্র

- [Features / বৈশিষ্ট্য](#-features--বৈশিষ্ট্য)
- [Prerequisites / পূর্বশর্ত](#-prerequisites--পূর্বশর্ত)
- [Installation / ইনস্টলেশন](#-installation--ইনস্টলেশন)
- [Ollama Model Setup / মডেল সেটআপ](#-ollama-model-setup--মডেল-সেটআপ)
- [Usage / ব্যবহার](#-usage--ব্যবহার)
- [Keyboard Shortcuts / কীবোর্ড শর্টকাট](#-keyboard-shortcuts--কীবোর্ড-শর্টকাট)
- [Configuration / কনফিগারেশন](#-configuration--কনফিগারেশন)
- [ZombieCoder Services / সার্ভিস](#-zombiecoder-services--সার্ভিস)
- [Troubleshooting / সমস্যা সমাধান](#-troubleshooting--সমস্যা-সমাধান)
- [Contributing / অবদান](#-contributing--অবদান)

---

## ✨ Features / বৈশিষ্ট্য

### 🤖 AI Features (ফ্রি!)

- **AI Chat Assistant** - কোড সম্পর্কে প্রশ্ন করুন, ব্যাখ্যা পান
- **Inline Code Assist** - সিলেক্ট করা কোডে AI এর সাহায্য নিন
- **Code Explanation** - জটিল কোড সহজে বুঝুন
- **Code Refactoring** - AI দিয়ে কোড উন্নত করুন
- **Test Generation** - AI দিয়ে টেস্ট লিখুন

### 🔧 Development Features

- **LSP Integration** - Language Server Protocol সাপোর্ট
- **DAP Integration** - Debug Adapter Protocol সাপোর্ট
- **Real-time Sync** - WebSocket দিয়ে রিয়েল-টাইম কোড সিঙ্ক
- **Multi-language Support** - Python, JavaScript, TypeScript সাপোর্ট

### 💰 Cost (খরচ)

| Feature          | Other Tools  | ZombieCoder |
| ---------------- | ------------ | ----------- |
| AI Chat          | $20/month    | **FREE** ✓  |
| Code Completion  | $10-20/month | **FREE** ✓  |
| Code Explanation | $20/month    | **FREE** ✓  |
| Total            | $50+/month   | **$0** 🎉   |

---

## 📋 Prerequisites / পূর্বশর্ত

### Required (আবশ্যক)

- **Zed Editor** - [Download](https://zed.dev/download)
- **Node.js** (v16+) - [Download](https://nodejs.org/)
- **Ollama** - [Download](https://ollama.ai/download)

### System Requirements (সিস্টেম প্রয়োজনীয়তা)

| RAM   | Recommended Models                       | মন্তব্য           |
| ----- | ---------------------------------------- | ----------------- |
| 4GB   | qwen2.5-coder:3b, starcoder2:3b          | Ultra lightweight |
| 8GB   | qwen2.5-coder:7b, codellama:7b           | Good balance      |
| 16GB+ | deepseek-coder-v2:16b, qwen2.5-coder:14b | Best quality      |

---

## 🚀 Installation / ইনস্টলেশন

### Quick Install (দ্রুত ইনস্টল)

```bash
# Clone the repository
git clone https://github.com/zombiecoder/zed-zombie.git
cd zed-zombie

# Run the installer
chmod +x install.sh
./install.sh
```

### Manual Install (ম্যানুয়াল ইনস্টল)

#### Step 1: Install Ollama

```bash
# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# macOS
brew install ollama

# Or download from: https://ollama.ai/download
```

#### Step 2: Start Ollama

```bash
ollama serve
```

#### Step 3: Pull a Model (মডেল ডাউনলোড)

```bash
# Recommended for most users (8GB RAM)
ollama pull qwen2.5-coder:7b

# For low RAM (4GB)
ollama pull qwen2.5-coder:3b

# For high-end systems (16GB+ RAM)
ollama pull deepseek-coder-v2:16b
```

#### Step 4: Install Extension

```bash
cd zed-zombie
npm install
node build.js
```

#### Step 5: Copy Configuration

```bash
# Linux
cp config/zed_settings.json ~/.config/zed/settings.json
cp config/zed_keymap.json ~/.config/zed/keymap.json

# macOS
cp config/zed_settings.json ~/Library/Application\ Support/Zed/settings.json
cp config/zed_keymap.json ~/Library/Application\ Support/Zed/keymap.json
```

#### Step 6: Restart Zed

Close and reopen Zed editor.

---

## 🤖 Ollama Model Setup / মডেল সেটআপ

### Recommended Models (প্রস্তাবিত মডেল)

#### 🏆 Best for Coding

```bash
# DeepSeek Coder V2 - সেরা কোডিং মডেল
ollama pull deepseek-coder-v2:16b    # 16GB+ RAM
ollama pull deepseek-coder-v2:lite   # 8GB RAM

# Qwen 2.5 Coder - চমৎকার পারফরম্যান্স
ollama pull qwen2.5-coder:14b        # 16GB+ RAM
ollama pull qwen2.5-coder:7b         # 8GB RAM
ollama pull qwen2.5-coder:3b         # 4GB RAM
```

#### 🦙 Code Llama (Meta)

```bash
ollama pull codellama:13b            # 16GB RAM
ollama pull codellama:7b             # 8GB RAM
```

#### ⭐ StarCoder2 (BigCode)

```bash
ollama pull starcoder2:15b           # 16GB+ RAM
ollama pull starcoder2:7b            # 8GB RAM
ollama pull starcoder2:3b            # 4GB RAM
```

#### 💎 Google CodeGemma

```bash
ollama pull codegemma:7b             # 8GB RAM
```

#### 🗃️ SQL Expert

```bash
ollama pull sqlcoder:15b             # 16GB+ RAM
```

### Check Available Models (ইনস্টল করা মডেল দেখুন)

```bash
ollama list
```

### Remove a Model (মডেল মুছুন)

```bash
ollama rm model-name
```

---

## 💡 Usage / ব্যবহার

### Open AI Assistant

1. **Zed ওপেন করুন**
2. **`Ctrl+Shift+Z`** চাপুন (macOS: `Cmd+Shift+Z`)
3. **AI প্যানেল খুলবে** - এখানে প্রশ্ন করুন!

### Inline AI Assist

1. **কোড সিলেক্ট করুন**
2. **`Ctrl+Shift+A`** চাপুন
3. **AI কে বলুন কী করতে হবে** (e.g., "explain this", "refactor", "add comments")

### Example Prompts (উদাহরণ)

#### বাংলায়:

```
এই কোডটি ব্যাখ্যা করো
এই ফাংশনটি রিফ্যাক্টর করো
এই কোডের জন্য টেস্ট লেখো
এখানে এরর হ্যান্ডলিং যোগ করো
```

#### In English:

```
Explain this code
Refactor this function to be more efficient
Write unit tests for this code
Add error handling here
Fix the bug in this code
```

---

## ⌨️ Keyboard Shortcuts / কীবোর্ড শর্টকাট

### AI Commands

| Shortcut       | Action           | কাজ                 |
| -------------- | ---------------- | ------------------- |
| `Ctrl+Shift+Z` | Toggle AI Panel  | AI প্যানেল টগল      |
| `Ctrl+Shift+A` | Inline AI Assist | ইনলাইন AI সাহায্য   |
| `Ctrl+Shift+Q` | Quote Selection  | সিলেকশন AI তে পাঠান |
| `Ctrl+Enter`   | Send to AI       | AI তে পাঠান         |

### Editor Commands

| Shortcut       | Action           | কাজ              |
| -------------- | ---------------- | ---------------- |
| `Ctrl+P`       | Quick Open       | ফাইল খুঁজুন      |
| `Ctrl+Shift+P` | Command Palette  | কমান্ড প্যালেট   |
| `F12`          | Go to Definition | ডেফিনিশনে যান    |
| `Shift+F12`    | Find References  | রেফারেন্স খুঁজুন |
| `F2`           | Rename Symbol    | নাম পরিবর্তন     |
| `Ctrl+/`       | Toggle Comment   | কমেন্ট টগল       |
| `Ctrl+Shift+F` | Global Search    | গ্লোবাল সার্চ    |

### Panel Commands

| Shortcut       | Action          | কাজ              |
| -------------- | --------------- | ---------------- |
| `Ctrl+B`       | Toggle Sidebar  | সাইডবার টগল      |
| `Ctrl+`` `     | Toggle Terminal | টার্মিনাল টগল    |
| `Ctrl+Shift+E` | File Explorer   | ফাইল এক্সপ্লোরার |
| `Ctrl+Shift+G` | Git Panel       | গিট প্যানেল      |

### Debug Commands

| Shortcut | Action            | কাজ              |
| -------- | ----------------- | ---------------- |
| `F5`     | Start/Continue    | শুরু/চালিয়ে যান |
| `F9`     | Toggle Breakpoint | ব্রেকপয়েন্ট টগল |
| `F10`    | Step Over         | স্টেপ ওভার       |
| `F11`    | Step Into         | স্টেপ ইনটু       |

---

## ⚙️ Configuration / কনফিগারেশন

### Settings File Location

| OS      | Path                                              |
| ------- | ------------------------------------------------- |
| Linux   | `~/.config/zed/settings.json`                     |
| macOS   | `~/Library/Application Support/Zed/settings.json` |
| Windows | `%APPDATA%\Zed\settings.json`                     |

### Change AI Model

Edit `settings.json`:

```json
{
    "assistant": {
        "default_model": {
            "provider": "ollama",
            "model": "qwen2.5-coder:7b" // আপনার মডেল এখানে
        }
    }
}
```

### Change Ollama URL (যদি দূরে চলছে)

```json
{
    "language_models": {
        "ollama": {
            "api_url": "http://localhost:11434" // বা আপনার সার্ভারের URL
        }
    }
}
```

---

## 🌐 ZombieCoder Services / সার্ভিস

ZombieCoder বিভিন্ন সার্ভিস ব্যবহার করে:

| Service       | Port  | Description     | বর্ণনা               |
| ------------- | ----- | --------------- | -------------------- |
| Main App      | 3000  | Web UI          | ওয়েব ইন্টারফেস      |
| WebSocket     | 3003  | Real-time sync  | রিয়েল-টাইম সিঙ্ক    |
| LSP           | 3004  | Language Server | ল্যাঙ্গুয়েজ সার্ভার |
| DAP           | 3005  | Debug Adapter   | ডিবাগ অ্যাডাপ্টার    |
| Proxy         | 5010  | Hybrid Proxy    | হাইব্রিড প্রক্সি     |
| Codebase Sync | 5051  | Code Sync       | কোড সিঙ্ক            |
| Ollama        | 11434 | AI Models       | AI মডেল              |

### Start Services

```bash
./start_zombiecoder.sh
```

### Stop Services

```bash
./stop_zombiecoder.sh
```

---

## 🔧 Troubleshooting / সমস্যা সমাধান

### Ollama Connection Failed

**সমস্যা:** AI কাজ করছে না

**সমাধান:**

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve

# Check available models
ollama list
```

### Model Not Responding

**সমস্যা:** AI উত্তর দিচ্ছে না

**সমাধান:**

```bash
# Try a smaller model
ollama pull qwen2.5-coder:3b

# Update settings.json with the new model
```

### High Memory Usage

**সমস্যা:** RAM বেশি ব্যবহার হচ্ছে

**সমাধান:**

- ছোট মডেল ব্যবহার করুন (3b বা 7b)
- অন্য অ্যাপ বন্ধ করুন
- `keep_alive` কমিয়ে দিন

### Zed Not Detecting Ollama

**সমস্যা:** Zed Ollama খুঁজে পাচ্ছে না

**সমাধান:**

1. Zed রিস্টার্ট করুন
2. `settings.json` চেক করুন
3. Ollama চালু আছে কিনা দেখুন

---

## 🤝 Contributing / অবদান

আমরা সবার অবদান স্বাগত জানাই!

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Report Bugs

- GitHub Issues এ রিপোর্ট করুন
- বাংলা বা English দুটোই গ্রহণযোগ্য

---

## 📜 License

MIT License - বিনামূল্যে ব্যবহার করুন, পরিবর্তন করুন, বিতরণ করুন!

---

## 🙏 Acknowledgments / কৃতজ্ঞতা

- [Ollama](https://ollama.ai/) - ফ্রি লোকাল AI মডেল হোস্টিং
- [Zed](https://zed.dev/) - দ্রুত, মডার্ন এডিটর
- [DeepSeek](https://deepseek.com/) - চমৎকার কোডিং মডেল
- [Qwen](https://qwen.ai/) - শক্তিশালী মাল্টি-লিঙ্গুয়াল মডেল

---

<div align="center">

## 🧟 ZombieCoder

**গরিবদের জন্য ফ্রি AI - Free AI for Everyone!**

Made with ❤️ by Sahon Srabon

[Report Bug](https://github.com/zombiecoder/zed-zombie/issues) · [Request Feature](https://github.com/zombiecoder/zed-zombie/issues)

</div>
