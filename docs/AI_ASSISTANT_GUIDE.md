# 🤖 AI Assistant Development Guide for ZombieCoder

> **This document is specifically for AI assistants (Claude, GPT, Gemini, etc.) working on the ZombieCoder project.**

---

## 📌 Executive Summary

You are helping develop **ZombieCoder** - a privacy-first, local-first AI code assistant for VS Code and Zed editors.

**Creator**: Sahon Srabon, Developer Zone, Dhaka, Bangladesh 🇧🇩
**Philosophy**: Privacy-first, no telemetry, free forever, Bengali & English support
**Status**: 85% complete, production-ready foundation

---

## 🎯 Core Mission

Before making ANY changes, understand:

1. **Privacy is Non-Negotiable** - User code never leaves their machine
2. **Identity Matters** - Creator attribution must be preserved
3. **Quality Over Speed** - Complete, working code > quick placeholders
4. **Honesty is Required** - Admit limitations, don't fake implementations
5. **Documentation is Sacred** - Code without docs is incomplete

---

## ✅ MUST DO Before Contributing

### 1. Read These Files (In Order)

```bash
1. README.md                        # Project overview
2. docs/ARCHITECTURE.md             # System design
3. docs/IMPLEMENTATION_STATUS.md    # Current status
4. CONTRIBUTING.md                  # Contribution rules
5. docs/DEVELOPMENT.md              # Development guide
```

### 2. Understand the Architecture

```
┌─────────────────────────────────┐
│   Editor (VS Code / Zed)        │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   Agent System (Router)         │
│   Coder | Terminal | RAG        │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   Backend Server (Node.js)      │
│   Express + WebSocket           │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   LLM Provider (Multi)          │
│   OpenAI | Anthropic | Ollama   │
└─────────────────────────────────┘
```

### 3. Check Current Working Directory Structure

```
zombiecoder/
├── extension/          # VS Code extension (TypeScript)
├── backend/           # Node.js API server
├── zed-zombie/        # Zed editor integration
├── docs/              # Documentation
├── temp/              # Working documents
├── scripts/           # Build scripts
└── zombi.db           # SQLite database
```

---

## 🚫 CRITICAL DON'Ts

### 1. Never Remove Working Code

```typescript
// ❌ NEVER do this:
// User: "Clean up the code"
// AI removes complex but working implementation

// ✅ Instead:
// AI: "I see complex code in X. Before refactoring, let me verify:
//      - Is this handling edge cases?
//      - Are there tests covering this?
//      - Should I add comments instead of simplifying?"
```

### 2. Never Add Telemetry/Tracking

```typescript
// ❌ ABSOLUTELY FORBIDDEN:
fetch('https://analytics.example.com/track', {
  body: JSON.stringify({ userId, action })
});

// ✅ CORRECT: Local-only logging
logger.info('User action performed', { action, timestamp });
```

### 3. Never Bypass Security

```typescript
// ❌ DANGEROUS:
function executeCommand(cmd: string) {
  exec(cmd); // No validation!
}

// ✅ SAFE:
async function executeCommand(cmd: string) {
  if (await terminalGuard.requestPermission(cmd)) {
    return sandboxExec.run(cmd);
  }
  throw new Error('Command not permitted');
}
```

### 4. Never Fake Implementations

```typescript
// ❌ DISHONEST:
async function generateCode(prompt: string) {
  return "// TODO: Implement this"; // User thinks it works!
}

// ✅ HONEST:
async function generateCode(prompt: string) {
  // Real implementation calling actual LLM
  const response = await llmProvider.complete({
    prompt,
    model: this.config.defaultModel
  });
  return response.choices[0].message.content;
}
```

### 5. Never Break Identity Attribution

```typescript
// ❌ WRONG: Removing creator identity
const headers = {
  'Content-Type': 'application/json'
};

// ✅ CORRECT: Preserving identity
const headers = {
  'Content-Type': 'application/json',
  'X-Powered-By': 'ZombieCoder-by-SahonSrabon'
};
```

---

## ✅ MUST DO When Contributing

### 1. Follow Existing Patterns

**Example: Adding a New Agent**

```typescript
// ✅ CORRECT: Follows existing pattern
import { AgentRequest, AgentResponse, AgentType } from '../types/agents';

export class NewAgent {
  private static instance: NewAgent;

  private constructor() {}

  static getInstance(): NewAgent {
    if (!NewAgent.instance) {
      NewAgent.instance = new NewAgent();
    }
    return NewAgent.instance;
  }

  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    // Implementation
    return {
      agentType: AgentType.NEW,
      mode: 'edit',
      content: 'Response content'
    };
  }
}
```

### 2. Update Documentation

When you change code, update:

```bash
✅ Code change in: extension/src/agents/coderAgent.ts
✅ Update: docs/ARCHITECTURE.md (if structure changed)
✅ Update: docs/IMPLEMENTATION_STATUS.md (mark feature complete)
✅ Update: README.md (if user-facing feature)
```

### 3. Add Comprehensive Comments

```typescript
/**
 * Processes user's chat request and routes to appropriate agent
 *
 * Flow:
 * 1. Extract editor context (file, selection, language)
 * 2. Analyze request to determine agent type
 * 3. Route to selected agent
 * 4. Return formatted response
 *
 * @param request - User's chat message with metadata
 * @param context - Current editor state
 * @returns AI-generated response with code suggestions
 * @throws {AgentNotFoundError} If no suitable agent available
 * @throws {LLMError} If AI service unavailable
 *
 * @example
 * ```ts
 * const response = await router.route({
 *   query: "Explain this function",
 *   type: AgentType.CODER
 * }, editorContext);
 * ```
 */
```

### 4. Write Real Tests

```typescript
// ✅ GOOD: Real test with actual assertions
describe('CoderAgent', () => {
  let agent: CoderAgent;
  let mockLLM: MockLLMProvider;

  beforeEach(() => {
    mockLLM = new MockLLMProvider();
    agent = new CoderAgent(mockLLM);
  });

  it('should generate code from natural language', async () => {
    mockLLM.setResponse('function add(a, b) { return a + b; }');

    const response = await agent.processRequest({
      query: 'Create a function to add two numbers',
      type: AgentType.CODER
    });

    expect(response.content).toContain('function');
    expect(response.content).toContain('add');
    expect(response.mode).toBe('edit');
  });
});
```

---

## 🎯 When You Can't Complete a Task

### Be Honest and Helpful

```
User: "Add real-time collaboration with cursor synchronization"

✅ EXCELLENT Response:
"I'll break this down honestly:

WHAT I CAN BUILD:
1. ✅ WebSocket server infrastructure (backend/src/websocket.ts)
2. ✅ Basic message broadcasting between clients
3. ✅ Cursor position data structure
4. ✅ Client connection management

WHAT NEEDS CAREFUL IMPLEMENTATION:
1. ⚠️ Operational Transformation for conflict resolution
   - I can implement basic OT algorithm
   - Edge cases need thorough testing
   - Consider using existing library (ShareDB, Yjs)

2. ⚠️ Cursor synchronization performance
   - Throttling strategy needed
   - Network latency handling
   - I can create basic version, needs optimization

WHAT I CANNOT TEST ALONE:
1. ❌ Multi-user conflict scenarios
2. ❌ Network partition handling
3. ❌ Performance under high load

RECOMMENDATION:
Let me implement:
- WebSocket infrastructure (complete)
- Basic cursor sync (functional but needs optimization)
- Documentation for advanced scenarios

Then we can test with real users and iterate.

Should I proceed with this approach?"

❌ BAD Response:
"Done! I've added real-time collaboration."
[Adds incomplete code that doesn't handle conflicts]
```

### Admit Limitations

```
User: "Optimize the vector database for 1M+ embeddings"

✅ HONEST Response:
"I understand the performance requirement. Here's my honest assessment:

LIMITATIONS:
- I can't benchmark 1M embeddings without actual data
- Performance optimization needs profiling real workloads
- Database indexing strategy depends on query patterns

WHAT I CAN DO:
1. Implement basic indexing (B-tree, HNSW)
2. Add batching for bulk operations
3. Document performance considerations
4. Suggest testing methodology

WHAT YOU NEED TO DO:
1. Profile with real dataset
2. Identify bottlenecks
3. Iterate on my implementation

I'll create a solid foundation with best practices.
You'll need to optimize based on real metrics.

Proceed?"
```

---

## 📋 Standard Checklist for Every Change

Before saying "done", verify:

- [ ] Code compiles without errors
- [ ] All existing tests still pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No hardcoded secrets or API keys
- [ ] Error handling is comprehensive
- [ ] TypeScript types are strict (no `any`)
- [ ] Code follows existing patterns
- [ ] Comments explain WHY, not WHAT
- [ ] Identity headers preserved
- [ ] No telemetry added

---

## 🔍 Common Mistakes to Avoid

### 1. Over-Simplification

```typescript
// ❌ BAD: Removing important error handling
async function chat(msg: string) {
  return await llm.complete(msg);
}

// ✅ GOOD: Preserving robust error handling
async function chat(msg: string): Promise<ChatResponse> {
  try {
    const context = await this.extractContext();
    const response = await this.llm.complete({
      prompt: msg,
      context,
      maxTokens: 2000
    });
    await this.history.save(msg, response);
    return response;
  } catch (error) {
    if (error instanceof NetworkError) {
      throw new ChatError('Network connection failed', error);
    }
    if (error instanceof RateLimitError) {
      throw new ChatError('Rate limit exceeded', error);
    }
    throw error;
  }
}
```

### 2. Ignoring Existing Patterns

```typescript
// ❌ BAD: Creating new pattern
export function newFeature() {
  // Different style from rest of codebase
}

// ✅ GOOD: Following established pattern
export class NewFeatureManager {
  private static instance: NewFeatureManager;

  static getInstance(): NewFeatureManager {
    if (!NewFeatureManager.instance) {
      NewFeatureManager.instance = new NewFeatureManager();
    }
    return NewFeatureManager.instance;
  }

  async execute(): Promise<void> {
    // Implementation following project conventions
  }
}
```

### 3. Incomplete Documentation

```typescript
// ❌ BAD: No documentation
function processData(data: any) {
  // Complex logic here
}

// ✅ GOOD: Comprehensive documentation
/**
 * Processes raw chat data and extracts structured information
 *
 * Handles:
 * - Message formatting
 * - Context extraction
 * - Metadata parsing
 *
 * @param data - Raw chat data from VS Code API
 * @returns Structured ChatRequest object
 * @throws {ValidationError} If data format is invalid
 */
function processData(data: ChatData): ChatRequest {
  // Implementation
}
```

---

## 🌟 Best Practices

### 1. Ask Before Major Changes

```
User: "Improve the code"

✅ GOOD:
"I see several potential improvements:

1. Backend routing structure
   - Current: Single file with all routes
   - Proposed: Separate files per domain
   - Impact: Better organization, no functional changes

2. Error handling in LLM service
   - Current: Generic error messages
   - Proposed: Specific error types with retry logic
   - Impact: Better user experience, more code

3. Database query optimization
   - Current: Individual queries
   - Proposed: Batch queries where possible
   - Impact: Performance improvement, complexity increase

Which should I prioritize? Or all three?"

❌ BAD:
[Silently refactors everything without asking]
```

### 2. Preserve Working Features

```typescript
// User: "Clean up the terminal guard"

// ❌ BAD: Removing "unnecessary" checks
async requestPermission(cmd: string): Promise<boolean> {
  return true; // Simplified! But now unsafe!
}

// ✅ GOOD: Cleaning while preserving safety
/**
 * Refactored for clarity, preserving all security checks
 */
async requestPermission(cmd: string): Promise<boolean> {
  // Check dangerous patterns
  if (this.isDangerousCommand(cmd)) {
    return false;
  }

  // Check whitelist
  if (this.isWhitelisted(cmd)) {
    return true;
  }

  // Request user permission
  return await this.showPermissionDialog(cmd);
}
```

### 3. Test Your Changes

```bash
# Before claiming "done", run:

# 1. Type checking
npm run type-check

# 2. Linting
npm run lint

# 3. Unit tests
npm test

# 4. Build
npm run build

# 5. Manual test (if UI change)
# - Install extension in VS Code
# - Test the specific feature
# - Verify no regressions
```

---

## 🎓 Learning from the Codebase

### Study These Examples

**Good Agent Implementation**:
```typescript
// extension/src/agents/coderAgent.ts
// Shows proper singleton, error handling, typing
```

**Good Service Implementation**:
```typescript
// backend/src/services/llmService.ts
// Shows provider abstraction, streaming, retry logic
```

**Good API Design**:
```typescript
// backend/src/routes/chat.ts
// Shows REST + WebSocket, validation, error responses
```

---

## 🌍 Cultural Context

### Bengali Support is Core

```typescript
// ✅ GOOD: Supporting both languages
const messages = {
  en: {
    greeting: "Hello! How can I help you code?",
    error: "An error occurred. Please try again."
  },
  bn: {
    greeting: "হ্যালো! আমি কিভাবে আপনার কোডিং এ সাহায্য করতে পারি?",
    error: "একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
  }
};

// ❌ BAD: English-only
const message = "Hello! How can I help?";
```

### Respect Creator Identity

```typescript
// Every response should acknowledge:
const identity = {
  name: "ZombieCoder",
  creator: "Sahon Srabon",
  organization: "Developer Zone",
  location: "Dhaka, Bangladesh"
};

// This is not optional - it's core to the project's identity
```

---

## 📞 When to Ask for Clarification

Ask the user when:

1. **Ambiguous Requirements**
   - "Should this feature work offline or require internet?"

2. **Multiple Valid Approaches**
   - "I can implement this using WebSocket or SSE. Which do you prefer?"

3. **Breaking Changes**
   - "This change will break backwards compatibility. Should I proceed?"

4. **Performance Tradeoffs**
   - "Faster but uses more memory, or slower but more efficient?"

5. **Security Implications**
   - "This feature needs file system access. How should we handle permissions?"

---

## 🎉 Success Criteria

You've contributed successfully when:

✅ Code works as expected
✅ Tests pass
✅ Documentation updated
✅ No security issues introduced
✅ Follows existing patterns
✅ Creator identity preserved
✅ No telemetry added
✅ Error handling is comprehensive
✅ You can explain WHY you made each decision

---

## 📚 Required Files to Reference

Keep these open while coding:

```bash
# Architecture
docs/ARCHITECTURE.md

# Current status
docs/IMPLEMENTATION_STATUS.md

# Type definitions
extension/src/types/index.ts
extension/src/types/agents.ts

# Core implementations
extension/src/agents/agentRouter.ts
backend/src/services/llmService.ts
```

---

## 🔒 Security Reminders

### Every PR Should Be Checked For:

- [ ] No hardcoded API keys or secrets
- [ ] No external data transmission without permission
- [ ] User input validation present
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized output)
- [ ] CSRF protection (backend endpoints)
- [ ] Rate limiting considered
- [ ] Error messages don't leak sensitive info

---

## 💡 Pro Tips

### 1. Use TypeScript Strictly

```typescript
// ✅ Enable strict mode
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 2. Log Meaningfully

```typescript
// ✅ GOOD: Structured logging
logger.info('Chat request processed', {
  sessionId,
  model,
  tokensUsed,
  duration: Date.now() - startTime
});

// ❌ BAD: Vague logging
console.log('Done');
```

### 3. Handle Async Properly

```typescript
// ✅ GOOD: Proper error handling
try {
  const result = await asyncOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', error);
  throw new CustomError('Specific error message', error);
}

// ❌ BAD: Swallowing errors
try {
  await asyncOperation();
} catch (e) {
  // Silent failure
}
```

---

## 🎬 Final Checklist Before Submitting

Before saying "I've completed the task":

- [ ] I've read the relevant documentation
- [ ] I've followed existing code patterns
- [ ] I've written comprehensive tests
- [ ] I've updated documentation
- [ ] I've preserved identity attribution
- [ ] I've added no telemetry
- [ ] I've handled errors properly
- [ ] I've tested the changes
- [ ] I can explain every decision I made
- [ ] I've been honest about limitations

---

## 🙏 Thank You

Thank you for contributing to ZombieCoder with integrity and care. Your honest, thorough work helps developers worldwide code better with AI assistance while maintaining their privacy and control.

**"যেখানে কোড ও কথা বলে" - Where Code and Speech Converge**

---

**Document Version**: 1.0
**Last Updated**: 2024-01-15
**Maintained By**: ZombieCoder Team
