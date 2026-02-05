# 🤝 Contributing to ZombieCoder

Thank you for your interest in contributing to ZombieCoder! This guide will help both **human developers** and **AI assistants** contribute effectively.

---

## 📋 Table of Contents

- [For AI Assistants](#-for-ai-assistants)
- [For Human Developers](#-for-human-developers)
- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Code Standards](#-code-standards)
- [Documentation Guidelines](#-documentation-guidelines)
- [Testing Requirements](#-testing-requirements)
- [Commit Guidelines](#-commit-guidelines)
- [Pull Request Process](#-pull-request-process)

---

## 🤖 For AI Assistants

> **Special Guidelines for Claude, GPT, Gemini, and other AI models**

If you're an AI assistant helping to develop this project, please follow these rules carefully:

### ✅ DO

#### 1. **Read Documentation First**

```bash
# ALWAYS check these files before making changes:
- README.md
- docs/ARCHITECTURE.md
- docs/IMPLEMENTATION_STATUS.md
- docs/DEVELOPMENT.md
```

#### 2. **Respect Project Structure**

- **NEVER** move files without explicit user request
- **NEVER** rename directories arbitrarily
- **NEVER** delete working code without understanding it
- Keep the established folder structure intact

#### 3. **Follow Existing Patterns**

```typescript
// ✅ GOOD: Follow existing patterns
export class NewAgent extends BaseAgent {
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    // Implementation
  }
}

// ❌ BAD: Creating completely different structure
class MyAgent {
  handle(req: any) {
    /* ... */
  }
}
```

#### 4. **Preserve Identity & Attribution**

- Keep `X-Powered-By: ZombieCoder-by-SahonSrabon` headers
- Maintain creator attribution in comments
- Don't remove identity metadata from `identity.json`

#### 5. **Update Documentation**

When you change code, update:

- Relevant markdown files in `/docs`
- Code comments (JSDoc style)
- README.md if adding features
- IMPLEMENTATION_STATUS.md for progress tracking

#### 6. **Ask Before Breaking Changes**

```
User: "Add a new feature"
AI: "I can implement this, but it will require changes to:
     - backend/src/routes/chat.ts (add new endpoint)
     - extension/src/agents/agentRouter.ts (register new agent)
     - docs/ARCHITECTURE.md (document the flow)

     Should I proceed?"
```

### ❌ DON'T

#### 1. **Don't Ignore Safety Systems**

- **NEVER** bypass the terminal safety layer
- **NEVER** disable permission checks
- **NEVER** remove security validations

```typescript
// ❌ BAD: Removing safety check
async executeCommand(cmd: string) {
  exec(cmd); // DANGEROUS!
}

// ✅ GOOD: Keeping safety layer
async executeCommand(cmd: string) {
  if (await this.terminalGuard.requestPermission(cmd)) {
    this.sandboxExec.run(cmd);
  }
}
```

#### 2. **Don't Add Telemetry**

- **NEVER** add analytics tracking
- **NEVER** send data to external servers
- **NEVER** collect usage statistics
- Privacy is core to this project

```typescript
// ❌ BAD: Adding telemetry
fetch("https://analytics.example.com", {
  body: JSON.stringify({ userId, action }),
});

// ✅ GOOD: Local-only logging
logger.info("User action", { action, timestamp });
```

#### 3. **Don't Simplify Prematurely**

```typescript
// ❌ BAD: Over-simplifying working code
async chat(msg: string) {
  return "TODO: Implement";
}

// ✅ GOOD: Keep functional code even if complex
async chat(msg: string): Promise<ChatResponse> {
  const context = await this.contextManager.extract();
  const agent = this.router.selectAgent(msg);
  const response = await agent.process(msg, context);
  return this.formatResponse(response);
}
```

#### 4. **Don't Fake Implementations**

```typescript
// ❌ BAD: Placeholder that pretends to work
async generateCode(prompt: string) {
  return "// Code generated"; // Doesn't actually call LLM!
}

// ✅ GOOD: Real implementation or clear TODO
async generateCode(prompt: string) {
  const response = await this.llmProvider.complete({
    prompt,
    model: this.config.model
  });
  return response.text;
}
```

### 🎯 When You Can't Complete a Task

**Be honest and helpful:**

```
User: "Add real-time collaboration"

✅ GOOD Response:
"I understand you want real-time collaboration. Here's my assessment:

LIMITATIONS:
- This requires WebSocket bidirectional sync
- I can create the socket server, but testing requires multiple clients
- Database schema needs modification for conflict resolution

WHAT I CAN DO:
1. Create WebSocket infrastructure in backend
2. Add basic message broadcasting
3. Document the architecture for full implementation

WHAT I CANNOT VERIFY:
- Multi-user conflict resolution
- Real-time cursor synchronization
- Performance under load

RECOMMENDATION:
Let me implement the foundation (1-2) and document (3) so you or
another developer can complete the testing and edge cases.

Should I proceed?"

❌ BAD Response:
"Done! I've added real-time collaboration."
[Adds fake code that doesn't actually work]
```

### 📚 Required Reading for AI Assistants

Before contributing, understand:

1. **Architecture** - `/docs/ARCHITECTURE.md`
2. **Current Status** - `/docs/IMPLEMENTATION_STATUS.md`
3. **Project Philosophy** - `README.md` (Core Principles section)
4. **Identity System** - `SYSTEM_IDENTITY.md`
5. **Bengali Context** - The project serves Bengali-speaking developers

### 🌍 Cultural Sensitivity

- This project is created by **Sahon Srabon** from **Bangladesh** 🇧🇩
- Bengali language support is a **core feature**, not optional
- Respect cultural context in examples and documentation
- "Zombie" theme is intentional branding, not a bug

---

## 👨‍💻 For Human Developers

### Prerequisites

- **Node.js** 18+
- **pnpm** (preferred) or npm
- **Git** 2.30+
- **VS Code** 1.85+ or **Zed Editor**
- **Ollama** (for local AI testing)

### First-Time Setup

```bash
# Clone the repository
git clone https://github.com/zombiecoderbd/Zombie-dance.git
cd Zombie-dance

# Install dependencies
pnpm install

# Setup database
cd backend
npm run setup-db

# Build extension
cd ../extension
npm run compile

# Run tests
npm test
```

---

## 🚀 Getting Started

### 1. **Pick an Issue**

- Check [GitHub Issues](https://github.com/zombiecoderbd/Zombie-dance/issues)
- Look for `good-first-issue` labels
- Comment to claim an issue before starting

### 2. **Create a Branch**

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. **Make Changes**

- Follow code standards (see below)
- Write tests for new features
- Update documentation

### 4. **Test Locally**

```bash
# Backend tests
cd backend && npm test

# Extension tests
cd extension && npm test

# Integration tests
npm run test:integration
```

### 5. **Commit and Push**

```bash
git add .
git commit -m "feat: Add amazing feature"
git push origin feature/your-feature-name
```

### 6. **Create Pull Request**

- Use the PR template
- Link related issues
- Add screenshots/videos if UI changes

---

## 📝 Code Standards

### TypeScript

```typescript
// ✅ GOOD: Strict typing, clear names, JSDoc
/**
 * Processes a chat request and returns AI response
 * @param request - The user's chat request
 * @returns Promise with AI-generated response
 */
export async function processChat(request: ChatRequest): Promise<ChatResponse> {
  // Implementation
}

// ❌ BAD: Implicit any, unclear names, no docs
export async function process(req: any) {
  // Implementation
}
```

### Naming Conventions

| Type       | Convention       | Example            |
| ---------- | ---------------- | ------------------ |
| Classes    | PascalCase       | `CoderAgent`       |
| Functions  | camelCase        | `processRequest()` |
| Constants  | UPPER_SNAKE_CASE | `MAX_RETRIES`      |
| Files      | kebab-case       | `agent-router.ts`  |
| Interfaces | PascalCase       | `ChatRequest`      |
| Types      | PascalCase       | `AgentType`        |

### File Organization

```
src/
├── agents/              # AI agent implementations
│   ├── coderAgent.ts
│   └── agentRouter.ts
├── services/            # Core services
│   ├── llmService.ts
│   └── contextManager.ts
├── types/               # TypeScript types/interfaces
│   └── index.ts
├── utils/               # Utility functions
│   └── logger.ts
└── index.ts            # Main entry point
```

### Error Handling

```typescript
// ✅ GOOD: Specific error handling
try {
  const response = await this.llmProvider.complete(prompt);
  return response;
} catch (error) {
  if (error instanceof NetworkError) {
    logger.error("Network error:", error);
    throw new ChatError("Failed to connect to LLM service", error);
  }
  throw error;
}

// ❌ BAD: Silent failures
try {
  return await this.llmProvider.complete(prompt);
} catch (error) {
  return null; // Don't hide errors!
}
```

---

## 📚 Documentation Guidelines

### Code Comments

```typescript
// ✅ GOOD: Explain WHY, not WHAT
// Use WebSocket instead of SSE because we need bidirectional communication
// for real-time cursor synchronization across multiple editors
this.setupWebSocket();

// ❌ BAD: Stating the obvious
// Create a WebSocket
this.setupWebSocket();
```

### JSDoc

````typescript
/**
 * Routes incoming chat requests to the appropriate AI agent
 *
 * @param request - User's chat request with context
 * @param context - Editor context (file path, selection, etc.)
 * @returns Agent response with suggested code or explanation
 * @throws {AgentNotFoundError} If no suitable agent found
 * @throws {LLMError} If AI service fails
 *
 * @example
 * ```ts
 * const response = await router.route({
 *   query: "Explain this function",
 *   type: AgentType.CODER
 * }, editorContext);
 * ```
 */
async route(
  request: AgentRequest,
  context: EditorContext
): Promise<AgentResponse>
````

### Documentation Updates

When adding features, update:

1. **README.md** - If user-facing feature
2. **docs/ARCHITECTURE.md** - If changing structure
3. **docs/IMPLEMENTATION_STATUS.md** - Mark as complete
4. **CHANGELOG.md** - Add to unreleased section

---

## 🧪 Testing Requirements

### Unit Tests

```typescript
// tests/agents/coderAgent.test.ts
describe("CoderAgent", () => {
  let agent: CoderAgent;

  beforeEach(() => {
    agent = new CoderAgent(mockLLMProvider);
  });

  it("should generate code from prompt", async () => {
    const response = await agent.processRequest({
      query: "Create a function to add two numbers",
      type: AgentType.CODER,
    });

    expect(response.content).toContain("function");
    expect(response.mode).toBe("edit");
  });
});
```

### Integration Tests

Test full workflows:

- User sends chat message → Backend processes → AI responds
- File saved → Context extracted → RAG indexed
- Terminal command suggested → Permission requested → Safely executed

### Manual Testing Checklist

- [ ] Extension installs without errors
- [ ] Chat interface opens and responds
- [ ] Code suggestions apply correctly
- [ ] Terminal commands request permission
- [ ] Settings persist across sessions
- [ ] Works with Ollama local models
- [ ] Works with OpenAI/Anthropic

---

## 📝 Commit Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance tasks

### Examples

```bash
# Feature
feat(extension): Add semantic code search with RAG

Implemented vector database for code embeddings.
Users can now search codebase using natural language.

Closes #123

# Bug fix
fix(backend): Resolve Ollama connection timeout

Increased timeout from 30s to 120s for large models.
Added retry logic for transient failures.

Fixes #456

# Documentation
docs: Update installation guide for Windows

Added troubleshooting section for common Windows issues.
```

---

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Commit messages are clear

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manually tested in VS Code/Zed

## Screenshots (if applicable)

[Add screenshots/videos]

## Checklist

- [ ] Code follows project standards
- [ ] Self-reviewed my code
- [ ] Commented complex sections
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests
- [ ] Tests pass locally

## Related Issues

Closes #XXX
```

### Review Process

1. **Automated Checks** - CI/CD runs tests
2. **Code Review** - Maintainer reviews code
3. **Discussion** - Address feedback
4. **Approval** - Maintainer approves
5. **Merge** - Squash and merge to main

---

## 🔒 Security Guidelines

### Don't Commit Secrets

```bash
# .env should NEVER be committed
.env
.env.local
.env.production

# Add to .gitignore
*.key
*.pem
*secret*
```

### API Keys

```typescript
// ✅ GOOD: Load from environment
const apiKey = process.env.OPENAI_API_KEY;

// ❌ BAD: Hardcoded
const apiKey = "sk-abc123..."; // NEVER DO THIS
```

### User Data Privacy

- Never log sensitive data
- Never send code to external services without permission
- Keep all processing local by default
- Encrypt stored API keys

---

## 🌍 Community Guidelines

### Be Respectful

- Treat everyone with respect
- Welcome newcomers
- Provide constructive feedback
- Assume good intentions

### Be Inclusive

- Use inclusive language
- Support Bengali and English equally
- Welcome contributors from all backgrounds

### Be Collaborative

- Communicate openly
- Ask for help when needed
- Offer help to others
- Share knowledge

---

## 📞 Getting Help

- **GitHub Issues** - Bug reports, feature requests
- **GitHub Discussions** - Questions, ideas, showcase
- **Email** - infi@zombiecoder.my.id
- **Documentation** - Check `/docs` folder first

---

## 🎉 Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Thanked in release notes
- Credited in documentation

Thank you for making ZombieCoder better! 🧟‍♂️

---

**"যেখানে কোড ও কথা বলে" - Where Code and Speech Converge**

© 2024 Sahon Srabon | Developer Zone | Dhaka, Bangladesh 🇧🇩
