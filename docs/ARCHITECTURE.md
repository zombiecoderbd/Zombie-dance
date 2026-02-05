# ZombieCursor AI - System Architecture

## Overview

ZombieCursor is a **local-first, privacy-preserving AI code assistant** built on a modular, 4-layer architecture.

\`\`\`
┌─────────────────────────────────┐
│ VS Code UI Layer │
│ (Chat, Commands, Sidebar) │
└────────────┬────────────────────┘
│
┌────────────▼────────────────────┐
│ Local Agent Layer │
│ (Coder, Terminal, RAG) │
└────────────┬────────────────────┘
│
┌────────────▼────────────────────┐
│ Model Routing Layer │
│ (Ollama, OpenAI, Claude, etc) │
└────────────┬────────────────────┘
│
┌────────────▼────────────────────┐
│ Safety & Storage Layer │
│ (Permissions, History, Index) │
└─────────────────────────────────┘
\`\`\`

## Component Breakdown

### 1. Safety Agreement Module (`safety/`)

**Responsibility**: Enforce user consent and security policies

**Key Classes**:

- `SafetyAgreement` - Manages user consent dialog and agreement storage

**Features**:

- One-time safety agreement on first launch
- Non-dismissible agreement screen
- Secure storage of user consent

### 2. Agent System (`agents/`)

**Responsibility**: Process requests through specialized AI agents

**Key Classes**:

- `CoderAgent` - Handles code generation and editing tasks
- `TerminalAgent` - Manages terminal command suggestions
- `RAGAgent` - Handles project indexing and semantic search
- `AgentRouter` - Routes requests to appropriate agent

**Flow**:
\`\`\`
User Request → AgentRouter → Specific Agent → Response
\`\`\`

### 3. Permission System (ATSL - AI Terminal Safety Layer)

**Location**: `permissions/terminalGuard.ts`

**Responsibility**: Control terminal execution with user permission

**Key Features**:

- Pre-flight command validation
- Permission dialog with risk levels
- Session-based permission caching
- Dangerous command pattern detection

**Permission Scopes**:

- `once` - Allow single execution
- `session` - Allow for current VS Code session
- `deny` - Block execution

### 4. History Management (`history/`)

**Responsibility**: Store and manage chat history locally

**Key Classes**:

- `HistoryManager` - Manages conversation history

**Storage**:

- Location: `~/.zombiecursor/data/history/`
- Format: JSON files per conversation
- Never sent to external servers

**Features**:

- Create new conversations
- Save messages with metadata
- Rename conversations
- Search history by keyword
- Export/import conversations
- Delete specific messages or entire conversations

### 5. RAG Index Engine (LRIE - Local RAG Indexing Engine)

**Location**: `indexing/projectIndexer.ts`

**Responsibility**: Index codebase for semantic search

**Key Classes**:

- `ProjectIndexer` - Scans and indexes project files

**Process**:

1. Scan project for source files
2. Filter by supported languages
3. Extract code chunks
4. Store in local vector database
5. Enable semantic search

**Supported Languages**:

- TypeScript, JavaScript, Python, PHP, HTML, CSS, JSON, Markdown

### 6. Dance Flow Engine (AOPL - AI Operation Playback Layer)

**Location**: `animations/danceFlowEngine.ts`

**Responsibility**: Animate code edits in editor

**Key Classes**:

- `DanceFlowEngine` - Executes animation sequences

**Supported Actions**:

- `move_cursor` - Animate cursor movement
- `insert_text` - Animate text insertion
- `highlight` - Highlight code regions
- `delete_text` - Animate text deletion
- `replace_text` - Animate text replacement

**Features**:

- Configurable animation speed
- Smooth cursor movement
- Visual feedback with highlighting
- Sequential command execution

### 7. Core Services (`services/`)

**Key Services**:

- `AIClient` - Handles communication with LLM backend (SSE/WebSocket)
- `ContextManager` - Extracts editor context
- `DiffManager` - Manages code patches and application
- `WebSocketClient` - WebSocket streaming support

### 8. Type System (`types/`)

**Core Interfaces**:

- `AgentRequest` / `AgentResponse` - Agent communication protocol
- `DanceCommand` - Animation command specification
- `TerminalPermissionRequest` / `TerminalPermissionResponse` - Permission protocol
- `ChatMessage` / `ChatHistory` - Message storage format

## Data Flow

### Chat Request Flow

\`\`\`
User types message in chat
↓
ZombieChatParticipant receives request
↓
ContextManager extracts editor context
↓
AgentRouter selects appropriate agent
↓
Selected agent processes request
↓
If edit: DanceFlowEngine animates changes
If terminal: TerminalGuard requests permission
If search: RAGAgent queries index
↓
Response streamed back to chat UI
↓
History saved to local storage
\`\`\`

### Terminal Command Flow

\`\`\`
TerminalAgent suggests command
↓
TerminalGuard validates command
↓
If dangerous: Block execution
↓
If allowed: Show permission dialog
↓
User decision (Allow/Deny)
↓
SandboxExec safely executes (if allowed)
↓
Output returned to chat
\`\`\`

### Project Indexing Flow

\`\`\`
User clicks "Index This Project"
↓
ProjectIndexer scans workspace
↓
Extract supported file types
↓
Generate embeddings locally
↓
Store in vector database
↓
RAGAgent uses index for search
↓
Better context for AI responses
\`\`\`

## Security Model

### Local-First Architecture

- ✓ All processing on user's machine
- ✓ No data transmission required
- ✓ Optional cloud API integration (user configurable)
- ✓ API keys stored in VS Code secret storage

### Permission Model

- ✓ User explicit consent on first launch
- ✓ Terminal commands require permission
- ✓ File modifications require approval (diff preview)
- ✓ Session-based permission scoping

### Data Isolation

- ✓ Chat history stored locally only
- ✓ Project index stored locally only
- ✓ No remote logging or telemetry
- ✓ User can delete all data anytime

## Configuration Points

### VS Code Settings

\`\`\`json
{
"zombie.endpoint": "http://localhost:8001",
"zombie.model": "gpt-4",
"zombie.streamTransport": "sse",
"zombie.allowTerminalCommands": false,
"zombie.animationSpeed": 200,
"zombie.autosaveOnApply": true
}
\`\`\`

### Extension Context

Stored in:

- User-specific local storage
- VS Code secret storage (API keys)
- Global state (agreements)

## Extensibility

### Adding New Agents

1. Create class extending base agent pattern
2. Implement `processRequest()` method
3. Register in `AgentRouter`
4. Add to command palette

### Adding New Animation Commands

1. Define command in `DanceCommand` interface
2. Implement in `DanceFlowEngine.executeCommand()`
3. Test with animation preview

### Custom LLM Integration

1. Implement in `AIClient.streamChat()`
2. Support both SSE and WebSocket
3. Handle streaming response format

## Performance Considerations

### Context Size Limits

- Default: 20KB per request
- Configurable: `zombie.contextSizeBytes`
- Prevents token limit overflow

### Animation Performance

- Configurable speed: 50-1000ms
- Non-blocking animation execution
- Graceful degradation on slow systems

### Index Size Management

- Max file size: 500KB per file
- Excludes: node_modules, .git, .venv, dist, build
- Automatic cleanup of old indexes

## Future Enhancements

- [ ] Multi-language support
- [ ] Plugin system for custom agents
- [ ] Advanced RAG with semantic chunking
- [ ] Real-time collaboration
- [ ] Custom model training
- [ ] Advanced debugging integration

## References

- VS Code Extension API: https://code.visualstudio.com/api
- Chat API: https://code.visualstudio.com/api/extension-guides/chat
- Security Best Practices: See `ZOMBIE_SAFETY_AGREEMENT.md`
