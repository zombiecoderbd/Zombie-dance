# 🧟 ZombieCoder VS Code Extension - Comprehensive Proposal

## 📋 Executive Summary

This document outlines the complete architecture, design, and implementation strategy for the ZombieCoder VS Code Extension - an AI-powered coding assistant that integrates seamlessly with the ZombieCoder backend service.

## 🎯 Project Overview

### Vision
Create a user-friendly, intelligent VS Code extension that provides real-time AI assistance for coding, debugging, and learning in both Bengali and English.

### Core Features
- 💬 **AI Chat Interface** - Interactive chat with multiple AI models
- 🔄 **Real-time Code Analysis** - Context-aware suggestions
- 📝 **Code Generation** - Generate code from natural language
- 🐛 **Debugging Assistant** - AI-powered debugging help
- 🌐 **Bilingual Support** - Bengali and English interface
- 🔌 **Multi-Model Support** - Switch between 15+ AI models
- 🚀 **Streaming Responses** - Real-time AI responses
- 📊 **Code Metrics** - Track coding productivity

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension                         │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  WebView UI    │  │  Extension     │  │  Language    │  │
│  │  (React)       │◄─┤  Host          │◄─┤  Server      │  │
│  │                │  │  (TypeScript)  │  │  (Optional)  │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
│         │                    │                               │
│         └────────────────────┼───────────────────────────┐  │
└──────────────────────────────┼───────────────────────────┼──┘
                               │                           │
                         ┌─────▼─────┐            ┌───────▼──────┐
                         │   Proxy   │            │   Direct     │
                         │  Server   │            │  Connection  │
                         │  (8002)   │            │   (8001)     │
                         └─────┬─────┘            └───────┬──────┘
                               │                          │
                               └──────────┬───────────────┘
                                          │
                                   ┌──────▼──────┐
                                   │   Backend   │
                                   │   Server    │
                                   │   (8001)    │
                                   └──────┬──────┘
                                          │
                          ┌───────────────┼───────────────┐
                          │               │               │
                    ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
                    │  SQLite   │  │  Ollama   │  │  OpenAI   │
                    │  Database │  │  Models   │  │  (Optional)│
                    └───────────┘  └───────────┘  └───────────┘
```

### Component Breakdown

#### 1. **Extension Host (TypeScript)**
- Extension activation and lifecycle management
- Command registration and handling
- API communication layer
- Configuration management
- State management
- Event handling

#### 2. **WebView UI (React + TypeScript)**
- Chat interface
- Code display and editing
- Model selection
- Settings panel
- History viewer
- Statistics dashboard

#### 3. **API Layer**
- HTTP client for REST endpoints
- WebSocket client for real-time updates
- Request/response handling
- Error handling and retry logic
- Authentication management

#### 4. **State Management**
- Conversation history
- Active model selection
- User preferences
- Session management

## 🎨 User Interface Design

### Main Chat Interface

```
┌────────────────────────────────────────────────────────────┐
│  🧟 ZombieCoder AI Assistant                    [─][□][×]  │
├────────────────────────────────────────────────────────────┤
│  Model: [Qwen 2.5 Coder 1.5B ▼]    [⚙️ Settings] [📊 Stats]│
├────────────────────────────────────────────────────────────┤
│                                                              │
│  💬 Chat History                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 👤 User: How do I create a React component?          │  │
│  │                                                        │  │
│  │ 🤖 Assistant: To create a React component, you can... │  │
│  │                                                        │  │
│  │ 👤 User: TypeScript এ কিভাবে করব?                   │  │
│  │                                                        │  │
│  │ 🤖 Assistant: TypeScript এ React component তৈরি...  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  📝 Your Message:                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Type your message here...                             │  │
│  │                                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  [📎 Attach Code] [🎤 Voice] [Send 📤]                      │
└────────────────────────────────────────────────────────────┘
```

### Model Selection Panel

```
┌────────────────────────────────────────────────────────────┐
│  🤖 Select AI Model                                          │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  🚀 Fast Models (< 2B parameters)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ○ Qwen 2.5 Coder 0.5B     [Speed: ⚡⚡⚡⚡⚡]          │  │
│  │ ● Qwen 2.5 Coder 1.5B     [Speed: ⚡⚡⚡⚡] (Default)  │  │
│  │ ○ Deepseek R1 1.5B        [Speed: ⚡⚡⚡⚡]            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  🧠 Balanced Models (2B-7B parameters)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ○ Gemma2 2B               [Speed: ⚡⚡⚡]              │  │
│  │ ○ Deepseek Coder 1.3B     [Speed: ⚡⚡⚡⚡]            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ☁️ Cloud Models (Powerful but slower)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ○ Mistral Large 3         [Speed: ⚡⚡]               │  │
│  │ ○ Qwen3 Next 80B          [Speed: ⚡⚡]               │  │
│  │ ○ Deepseek V3.2           [Speed: ⚡⚡]               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Test Model] [Apply] [Cancel]                              │
└────────────────────────────────────────────────────────────┘
```

### Settings Panel

```
┌────────────────────────────────────────────────────────────┐
│  ⚙️ ZombieCoder Settings                                     │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  🔗 Connection                                               │
│  ├─ Backend URL: [http://localhost:8001    ]                │
│  ├─ Proxy URL:   [http://localhost:8002    ]                │
│  └─ Use Proxy:   [✓] Enabled                                │
│                                                              │
│  🌐 Language & Region                                        │
│  ├─ Interface Language: [Bangla ▼]                          │
│  └─ Response Language:  [Both ▼]                            │
│                                                              │
│  🤖 AI Behavior                                              │
│  ├─ Default Model:      [Qwen 2.5 Coder 1.5B ▼]            │
│  ├─ Temperature:        [0.7 ━━━━━○━━━━ 1.0]               │
│  ├─ Max Tokens:         [2048                ]              │
│  └─ Auto-suggest:       [✓] Enabled                         │
│                                                              │
│  💬 Chat Settings                                            │
│  ├─ Streaming:          [✓] Enabled                         │
│  ├─ Code Highlighting:  [✓] Enabled                         │
│  ├─ Auto-scroll:        [✓] Enabled                         │
│  └─ Save History:       [✓] Enabled                         │
│                                                              │
│  🎨 Appearance                                               │
│  ├─ Theme:              [Auto ▼]                            │
│  ├─ Font Size:          [14px ▼]                            │
│  └─ Compact Mode:       [ ] Disabled                        │
│                                                              │
│  [Reset to Default] [Save Settings]                         │
└────────────────────────────────────────────────────────────┘
```

## 📂 Project Structure

```
extension/
├── package.json                 # Extension manifest
├── tsconfig.json               # TypeScript configuration
├── webpack.config.js           # Webpack bundling config
├── .vscodeignore              # Files to exclude from package
├── README.md                   # Extension documentation
├── CHANGELOG.md               # Version history
│
├── src/
│   ├── extension.ts           # Main extension entry point
│   │
│   ├── commands/              # VS Code commands
│   │   ├── index.ts
│   │   ├── chatCommands.ts
│   │   ├── modelCommands.ts
│   │   └── settingsCommands.ts
│   │
│   ├── api/                   # Backend API integration
│   │   ├── client.ts          # HTTP client
│   │   ├── websocket.ts       # WebSocket client
│   │   ├── types.ts           # API types
│   │   └── endpoints.ts       # API endpoints
│   │
│   ├── providers/             # VS Code providers
│   │   ├── chatViewProvider.ts
│   │   ├── completionProvider.ts
│   │   ├── hoverProvider.ts
│   │   └── codeActionProvider.ts
│   │
│   ├── state/                 # State management
│   │   ├── store.ts
│   │   ├── conversationState.ts
│   │   └── settingsState.ts
│   │
│   ├── utils/                 # Utility functions
│   │   ├── logger.ts
│   │   ├── errorHandler.ts
│   │   ├── formatter.ts
│   │   └── validation.ts
│   │
│   └── webview/               # WebView UI (React)
│       ├── index.tsx
│       ├── App.tsx
│       │
│       ├── components/
│       │   ├── Chat/
│       │   │   ├── ChatInterface.tsx
│       │   │   ├── MessageList.tsx
│       │   │   ├── MessageItem.tsx
│       │   │   └── InputArea.tsx
│       │   │
│       │   ├── Models/
│       │   │   ├── ModelSelector.tsx
│       │   │   ├── ModelCard.tsx
│       │   │   └── ModelStats.tsx
│       │   │
│       │   ├── Settings/
│       │   │   ├── SettingsPanel.tsx
│       │   │   ├── ConnectionSettings.tsx
│       │   │   ├── AISettings.tsx
│       │   │   └── AppearanceSettings.tsx
│       │   │
│       │   └── Common/
│       │       ├── Button.tsx
│       │       ├── Input.tsx
│       │       ├── Select.tsx
│       │       └── Loading.tsx
│       │
│       ├── hooks/
│       │   ├── useChat.ts
│       │   ├── useModels.ts
│       │   ├── useSettings.ts
│       │   └── useWebSocket.ts
│       │
│       ├── styles/
│       │   ├── global.css
│       │   ├── chat.css
│       │   └── themes.css
│       │
│       └── utils/
│           ├── api.ts
│           ├── markdown.ts
│           └── codeHighlight.ts
│
├── resources/                  # Extension resources
│   ├── icons/
│   │   ├── zombie-icon.png
│   │   ├── light/
│   │   └── dark/
│   │
│   └── templates/
│       └── welcome.md
│
├── test/                      # Tests
│   ├── suite/
│   │   ├── extension.test.ts
│   │   ├── api.test.ts
│   │   └── commands.test.ts
│   │
│   └── fixtures/
│       └── mockData.ts
│
└── docs/                      # Documentation
    ├── ARCHITECTURE.md
    ├── API.md
    ├── CONTRIBUTING.md
    └── TROUBLESHOOTING.md
```

## 🔧 Technical Implementation

### 1. Extension Entry Point (extension.ts)

```typescript
import * as vscode from 'vscode';
import { ChatViewProvider } from './providers/chatViewProvider';
import { APIClient } from './api/client';
import { StateStore } from './state/store';
import { registerCommands } from './commands';

export async function activate(context: vscode.ExtensionContext) {
    console.log('🧟 ZombieCoder Extension Activating...');

    // Initialize state store
    const store = new StateStore(context);

    // Initialize API client
    const apiClient = new APIClient(store);
    await apiClient.initialize();

    // Register chat view provider
    const chatProvider = new ChatViewProvider(context.extensionUri, apiClient, store);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('zombiecoder.chatView', chatProvider)
    );

    // Register commands
    registerCommands(context, apiClient, store, chatProvider);

    // Show welcome message
    showWelcomeMessage(context);

    console.log('✅ ZombieCoder Extension Activated');
}

export function deactivate() {
    console.log('🧟 ZombieCoder Extension Deactivating...');
}
```

### 2. API Client (api/client.ts)

```typescript
import axios, { AxiosInstance } from 'axios';
import { WebSocketClient } from './websocket';
import { StateStore } from '../state/store';

export class APIClient {
    private httpClient: AxiosInstance;
    private wsClient: WebSocketClient;
    private baseURL: string;

    constructor(private store: StateStore) {
        this.baseURL = this.store.getBackendURL();
        this.httpClient = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Type': 'vscode-extension',
                'X-Extension-Version': this.store.getExtensionVersion()
            }
        });

        this.wsClient = new WebSocketClient(this.baseURL);
    }

    async initialize(): Promise<void> {
        // Test connection
        const isConnected = await this.testConnection();
        if (!isConnected) {
            throw new Error('Failed to connect to backend');
        }

        // Load models
        await this.loadModels();
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await this.httpClient.get('/v1/health');
            return response.data.status === 'ok';
        } catch (error) {
            return false;
        }
    }

    async getModels(): Promise<Model[]> {
        const response = await this.httpClient.get('/v1/chat/models');
        return response.data;
    }

    async sendMessage(message: string, modelId: number): Promise<ChatResponse> {
        const response = await this.httpClient.post('/v1/chat', {
            messages: [{ role: 'user', content: message }],
            modelId,
            stream: false
        });
        return response.data;
    }

    async streamMessage(
        message: string,
        modelId: number,
        onChunk: (chunk: string) => void
    ): Promise<void> {
        const response = await this.httpClient.post('/v1/chat/stream', {
            messages: [{ role: 'user', content: message }],
            modelId,
            stream: true
        }, {
            responseType: 'stream'
        });

        // Handle streaming response
        response.data.on('data', (chunk: Buffer) => {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data !== '[DONE]') {
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                onChunk(parsed.content);
                            }
                        } catch (e) {
                            // Ignore parse errors
                        }
                    }
                }
            }
        });
    }
}
```

### 3. Chat View Provider (providers/chatViewProvider.ts)

```typescript
import * as vscode from 'vscode';
import { APIClient } from '../api/client';
import { StateStore } from '../state/store';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly apiClient: APIClient,
        private readonly store: StateStore
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'sendMessage':
                    await this.handleSendMessage(message.data);
                    break;
                case 'switchModel':
                    await this.handleSwitchModel(message.data);
                    break;
                case 'loadModels':
                    await this.handleLoadModels();
                    break;
            }
        });
    }

    private async handleSendMessage(data: any) {
        const { message, modelId, streaming } = data;

        if (streaming) {
            await this.apiClient.streamMessage(message, modelId, (chunk) => {
                this._view?.webview.postMessage({
                    type: 'messageChunk',
                    data: { chunk }
                });
            });

            this._view?.webview.postMessage({
                type: 'messageComplete'
            });
        } else {
            const response = await this.apiClient.sendMessage(message, modelId);
            this._view?.webview.postMessage({
                type: 'messageResponse',
                data: response
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Generate HTML for webview
        // This will load the React app
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ZombieCoder Chat</title>
        </head>
        <body>
            <div id="root"></div>
            <script src="${this.getScriptUri(webview)}"></script>
        </body>
        </html>`;
    }
}
```

### 4. React Chat Component (webview/components/Chat/ChatInterface.tsx)

```tsx
import React, { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { useChat } from '../../hooks/useChat';
import { useModels } from '../../hooks/useModels';

export const ChatInterface: React.FC = () => {
    const { messages, sendMessage, isLoading } = useChat();
    const { models, selectedModel, selectModel } = useModels();

    const handleSendMessage = async (message: string) => {
        await sendMessage(message, selectedModel.id);
    };

    return (
        <div className="chat-interface">
            <div className="chat-header">
                <h3>🧟 ZombieCoder AI</h3>
                <select 
                    value={selectedModel?.id} 
                    onChange={(e) => selectModel(Number(e.target.value))}
                >
                    {models.map(model => (
                        <option key={model.id} value={model.id}>
                            {model.displayName}
                        </option>
                    ))}
                </select>
            </div>

            <MessageList messages={messages} />
            <InputArea 
                onSend={handleSendMessage} 
                disabled={isLoading}
            />
        </div>
    );
};
```

## 🔌 Integration with Backend

### Connection Flow

```
1. Extension Activation
   ↓
2. Load Settings (Backend URL, Proxy URL)
   ↓
3. Test Connection (/v1/health)
   ↓
4. Load Available Models (/v1/chat/models)
   ↓
5. Initialize WebSocket (ws://localhost:8001/v1/chat/ws)
   ↓
6. Ready for User Interaction
```

### API Endpoints Usage

```typescript
// Health Check
GET /v1/health

// Get Models
GET /v1/chat/models

// Basic Chat
POST /v1/chat
{
    "messages": [{ "role": "user", "content": "Hello" }],
    "modelId": 1
}

// Streaming Chat
POST /v1/chat/stream
{
    "messages": [{ "role": "user", "content": "Hello" }],
    "modelId": 1,
    "stream": true
}

// WebSocket
WS /v1/chat/ws
{
    "type": "chat",
    "data": {
        "messages": [{ "role": "user", "content": "Hello" }],
        "modelId": 1
    }
}
```

## 🎯 Key Features Implementation

### 1. **Code Context Awareness**

```typescript
// Automatically include current file context
async function getCodeContext(): Promise<string> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return '';

    const document = editor.document;
    const selection = editor.selection;

    return {
        fileName: document.fileName,
        language: document.languageId,
        selection: document.getText(selection),
        surroundingCode: getSurroundingCode(document, selection)
    };
}
```

### 2. **Inline Code Suggestions**

```typescript
// Provide inline completions
class ZombieCompletionProvider implements vscode.InlineCompletionItemProvider {
    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<vscode.InlineCompletionItem[]> {
        const context = getCodeContext();
        const suggestions = await apiClient.getSuggestions(context);
        
        return suggestions.map(s => new vscode.InlineCompletionItem(s.text));
    }
}
```

### 3. **Bilingual Support**

```typescript
interface Translation {
    en: string;
    bn: string;
}

const translations: Record<string, Translation> = {
    'chat.title': {
        en: 'ZombieCoder AI Assistant',
        bn: 'জম্বিকোডার এআই সহায়ক'
    },
    'chat.placeholder': {
        en: 'Type your message...',
        bn: 'আপনার বার্তা লিখুন...'
    }
    // ... more translations
};

function t(key: string): string {
    const lang = store.getLanguage();
    return translations[key][lang] || translations[key].en;
}
```

## 📦 Package Configuration (package.json)

```json
{
    "name": "zombiecoder-ai",
    "displayName": "ZombieCoder AI Assistant",
    "description": "AI-powered coding assistant with Bengali support",
    "version": "1.0.0",
    "engines": {
        "vscode": "^1.85.0"
    },
    "categories": [
        "AI",
        "Chat",
        "Programming Languages",
        "Snippets"
    ],
    "activationEvents": [
        "onStartupFinished"
    ],
    "main": "./dist/extension.js",
    "contributes": {
        "viewsContainers": {
            "activitybar": [
                {
                    "id": "zombiecoder",
                    "title": "ZombieCoder AI",
                    "icon": "resources/zombie-icon.svg"
                }
            ]
        },
        "views": {
            "zombiecoder": [
                {
                    "id": "zombiecoder.chatView",
                    "name": "Chat",
                    "type": "webview"
                }
            ]
        },
        "commands": [
            {
                "command": "zombiecoder.openChat",
                "title": "Open ZombieCoder Chat",
                "category": "ZombieCoder"
            },
            {
                "command": "zombiecoder.askQuestion",
                "title": "Ask ZombieCoder",
                "category": "ZombieCoder"
            },
            {
                "command": "zombiecoder.explainCode",
                "title": "Explain This Code",
                "category": "ZombieCoder"
            },
            {
                "command": "zombiecoder.fixCode",
                "title": "Fix This Code",
                "category": "ZombieCoder"
            }
        ],
        "keybindings": [
            {
                "command": "zombiecoder.openChat",
                "key": "ctrl+shift+z",
                "mac": "cmd+shift+z"
            },
            {
                "command": "zombiecoder.askQuestion",
                "key": "ctrl+shift+a",
                "mac": "cmd+shift+a"
            }
        ],
        "configuration": {
            "title": "ZombieCoder",
            "properties": {
                "zombiecoder.backendUrl": {
                    "type": "string",
                    "default": "http://localhost:8001",
                    "description": "Backend server URL"
                },
                "zombiecoder.proxyUrl": {
                    "type": "string",
                    "default": "http://localhost:8002",
                    "description": "Proxy server URL"
                },
                "zombiecoder.useProxy": {
                    "type": "boolean",
                    "default": true,
                    "description": "Use proxy server for requests"
                },
                "zombiecoder.language": {
                    "type": "string",
                    "enum": ["en", "bn", "both"],
                    "default": "both",
                    "description": "Interface language"
                },
                "zombiecoder.defaultModel": {
                    "type": "string",
                    "default": "qwen2.5-coder:1.5b",
                    "description": "Default AI model"
                }
            }
        }
    },
    "scripts": {
        "vscode:prepublish": "npm run compile",
        "compile": "webpack --mode production",
        "watch": "webpack --mode development --watch",
        "test": "node ./out/test/runTest.js"
    },
    "devDependencies": {
        "@types/vscode": "^1.85.0",
        "@types/node": "^20.0.0",
        "typescript": "^5.3.0",
        "webpack": "^5.89.0",
        "webpack-cli": "^5.1.0"
    },
    "dependencies": {
        "axios": "^1.6.0",
        "ws": "^8.14.0"
    }
}
```

## 🚀 Development Roadmap

### Phase 1: Core Functionality (Weeks 1-2)
- ✅ Extension scaffolding
- ✅ Basic API integration
- ✅ Simple chat interface
- ✅ Model selection
- ✅ Settings management

### Phase 2: Enhanced UI (Weeks 3-4)
- React-based WebView
- Improved chat interface
- Code highlighting
- Markdown rendering
- Theme support

### Phase 3: Advanced Features (Weeks 5-6)
- Code context awareness
- Inline completions
- Code actions
- Debugging assistance
- History management

### Phase 4: Polish & Testing (Weeks 7-8)
- Comprehensive testing
- Performance optimization
- Documentation
- User feedback integration
- Publishing to VS Code Marketplace

## 📊 Success Metrics

1. **User Engagement**
   - Daily active users
   - Messages sent per session
   - Feature usage statistics

2. **Performance**
   - Response time < 2s
   - Extension activation < 1s
   - Memory usage < 100MB

3. **User Satisfaction**
   - User ratings > 4.5/5
   - Positive feedback
   - Low uninstall rate

## 🔒 Security Considerations

1. **API Key Management**
   - Secure storage in VS Code SecretStorage
   - Never log or expose keys

2. **Data Privacy**
   - Local processing when possible
   - Clear data retention policies
   - User consent for data collection

3. **Network Security**
   - HTTPS for all external APIs
   - Certificate validation
   - Timeout handling

## 🌐 Internationalization (i18n)

###
