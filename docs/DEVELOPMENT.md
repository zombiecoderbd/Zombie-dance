# ZombieCursor AI - Development Guide

## Setting Up Development Environment

### Prerequisites

- Node.js 16+ (use nvm for version management)
- npm or yarn
- Git
- VS Code 1.85.0+

### Setup Steps

\`\`\`bash
# Clone repository
git clone https://github.com/zombiecoder1/TypeScript-extensions-VS-Code
cd TypeScript-extensions-VS-Code

# Install dependencies
cd extension
npm install

# Compile TypeScript
npm run compile

# Start watch mode for development
npm run watch
\`\`\`

## Development Workflow

### 1. Launch Extension in Debug Mode

\`\`\`bash
# In extension folder
npm run watch    # Terminal 1 - auto-compile on changes
\`\`\`

Then in VS Code:
- Press `F5` to start Extension Development Host
- New VS Code window opens with extension loaded
- Changes auto-reload

### 2. Debug Output

Output appears in "Extension Host" console. Use:

\`\`\`typescript
console.log("[v0] Debug message:", variable)
\`\`\`

### 3. Testing

\`\`\`bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm run lint               # Check code style
\`\`\`

## Project Structure

\`\`\`
extension/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── chatParticipant.ts        # Chat handler
│   │
│   ├── agents/
│   │   ├── coderAgent.ts         # Code editing agent
│   │   ├── terminalAgent.ts      # Terminal agent
│   │   ├── ragAgent.ts           # Search agent
│   │   └── agentRouter.ts        # Agent dispatcher
│   │
│   ├── services/
│   │   ├── aiClient.ts           # LLM communication
│   │   ├── contextManager.ts     # Context extraction
│   │   ├── diffManager.ts        # Diff management
│   │   └── websocketClient.ts    # WebSocket streaming
│   │
│   ├── permissions/
│   │   ├── terminalGuard.ts      # Terminal permission control
│   │   └── sandboxExec.ts        # Safe execution
│   │
│   ├── history/
│   │   └── historyManager.ts     # Chat history storage
│   │
│   ├── indexing/
│   │   └── projectIndexer.ts     # Project indexing
│   │
│   ├── animations/
│   │   └── danceFlowEngine.ts    # Code animation
│   │
│   ├── safety/
│   │   └── safetyAgreement.ts    # Safety agreement dialog
│   │
│   ├── types/
│   │   ├── index.ts              # Main types
│   │   └── agents.ts             # Agent types
│   │
│   └── test/
│       ├── extension.test.ts     # Unit tests
│       └── runTest.ts            # Test runner
│
├── resources/
│   └── icon.png                  # Extension icon
│
├── dist/                         # Compiled output
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## Code Standards

### TypeScript Rules

- Use strict mode: `"strict": true` in tsconfig.json
- Type everything: no implicit `any`
- Use interfaces for complex types
- Document public APIs with JSDoc

### Naming Conventions

- Classes: PascalCase (`CoderAgent`)
- Functions: camelCase (`processRequest()`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- Private members: `_privateField`
- Interfaces: PascalCase with `I` prefix is optional

### Code Style

\`\`\`typescript
// Good: Clear, documented, typed
export class AgentRouter {
  /**
   * Routes request to appropriate agent based on type
   * @param request - The agent request
   * @returns Response from selected agent
   */
  async routeRequest(request: AgentRequest): Promise<AgentResponse> {
    // Implementation
  }
}

// Bad: Implicit types, unclear purpose
export class Router {
  route(req: any) {
    // ...
  }
}
\`\`\`

## Adding Features

### Add New Agent Type

1. Create file: `src/agents/customAgent.ts`

\`\`\`typescript
import { type AgentResponse, AgentType } from "../types/agents"

export class CustomAgent {
  private static instance: CustomAgent

  private constructor() {}

  static getInstance(): CustomAgent {
    if (!CustomAgent.instance) {
      CustomAgent.instance = new CustomAgent()
    }
    return CustomAgent.instance
  }

  async processRequest(query: string): Promise<AgentResponse> {
    return {
      agentType: AgentType.CUSTOM,
      mode: "edit",
      content: "Response",
    }
  }
}
\`\`\`

2. Register in `agentRouter.ts`:

\`\`\`typescript
case AgentType.CUSTOM:
  return this.customAgent.processRequest(request.query)
\`\`\`

3. Add to agent types:

\`\`\`typescript
export enum AgentType {
  CODER = "coder",
  TERMINAL = "terminal",
  RAG = "rag",
  CUSTOM = "custom", // Add this
}
\`\`\`

### Add New Command

1. Register in `extension.ts`:

\`\`\`typescript
context.subscriptions.push(
  vscode.commands.registerCommand("zombie.newCommand", async () => {
    // Command implementation
  }),
)
\`\`\`

2. Add to `package.json`:

\`\`\`json
{
  "command": "zombie.newCommand",
  "title": "New Command",
  "category": "ZombieCursor"
}
\`\`\`

## Testing

### Unit Test Example

\`\`\`typescript
// src/test/agents.test.ts
import { describe, it, expect } from "vitest"
import { CoderAgent } from "../agents/coderAgent"

describe("CoderAgent", () => {
  it("should process code explanation request", async () => {
    const agent = CoderAgent.getInstance()
    const response = await agent.processRequest("Explain this code")

    expect(response.agentType).toBe("coder")
    expect(response.mode).toBe("edit")
  })
})
\`\`\`

Run tests:

\`\`\`bash
npm test
\`\`\`

## Debugging Tips

### Enable Debug Logging

\`\`\`typescript
// In extension.ts
if (process.env.DEBUG) {
  console.log("[DEBUG] Message:", data)
}
\`\`\`

Then run:

\`\`\`bash
DEBUG=1 code --extensionDevelopmentPath=extension
\`\`\`

### Inspect Chat Context

\`\`\`typescript
console.log("[v0] Context:", JSON.stringify(workspaceContext, null, 2))
\`\`\`

### Check Stored Data

\`\`\`bash
# View history
cat ~/.zombiecursor/data/history/*.json | jq .

# View indexes
cat ~/.zombiecursor/data/indexes/*.json | jq .
\`\`\`

## Performance Profiling

### Check Extension Load Time

In VS Code:
1. Open Developer Tools: `Help > Toggle Developer Tools`
2. Check "Extension Host" output for load time
3. Look for slow operations

### Monitor Memory Usage

\`\`\`typescript
setInterval(() => {
  const mem = process.memoryUsage()
  console.log("[MEMORY]", {
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(mem.external / 1024 / 1024)}MB`,
  })
}, 5000)
\`\`\`

## Contribution Guidelines

### Before Submitting PR

- [ ] All tests pass: `npm test`
- [ ] No lint errors: `npm run lint`
- [ ] Code compiles: `npm run compile`
- [ ] Documentation updated
- [ ] Types are strict (no `any`)
- [ ] Security review completed

### Commit Message Format

\`\`\`
<type>: <subject>

<body>

Fixes #<issue-number>
\`\`\`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Security Considerations

- No external API calls (unless user-configured)
- No data transmission without explicit permission
- Validate all user input
- Use secure storage for sensitive data
- Review diff content before application

## Common Issues

### "Cannot find module 'vscode'"

\`\`\`bash
npm install
npm run compile
\`\`\`

### TypeScript errors won't go away

Clear cache and rebuild:

\`\`\`bash
rm -rf dist out node_modules
npm install
npm run compile
\`\`\`

### Extension not loading

1. Check output console: `Ctrl+Shift+U` → "Extension Host"
2. Look for syntax errors or missing imports
3. Verify all file paths are correct

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Chat Extension Guide](https://code.visualstudio.com/api/extension-guides/chat)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Project Architecture](./ARCHITECTURE.md)

## Support

For issues:
1. Check existing GitHub issues
2. Review documentation
3. Create detailed bug report with:
   - Reproduction steps
   - Expected vs actual behavior
   - Error logs from Extension Host
   - VS Code version and OS

Happy coding!
