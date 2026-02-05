import { type AgentResponse, AgentType, type TerminalPermissionRequest } from "../types/agents"
import { TerminalGuard } from "../permissions/terminalGuard"

export class TerminalAgent {
  private static instance: TerminalAgent
  private terminalGuard: TerminalGuard

  private constructor() {
    this.terminalGuard = TerminalGuard.getInstance()
  }

  static getInstance(): TerminalAgent {
    if (!TerminalAgent.instance) {
      TerminalAgent.instance = new TerminalAgent()
    }
    return TerminalAgent.instance
  }

  async processRequest(query: string, permissionRequest?: TerminalPermissionRequest): Promise<AgentResponse> {
    // Terminal agent MUST request permission before executing
    const response: AgentResponse = {
      agentType: AgentType.TERMINAL,
      mode: "command",
      content: query,
      requiresPermission: true,
      permissionType: "terminal",
    }

    if (permissionRequest) {
      const permission = await this.terminalGuard.requestPermission(permissionRequest)

      if (permission.allowed) {
        response.content = `Executing: ${permissionRequest.command}`
      } else {
        response.content = `Terminal execution blocked by user`
      }
    }

    return response
  }

  async suggestCommand(task: string): Promise<string> {
    // Suggest a terminal command for a task
    return `# Suggested command for: ${task}`
  }

  async validateCommand(command: string): Promise<boolean> {
    // Validate if command is safe to execute
    const dangerousPatterns = [/rm\s+-rf\s+\//, /dd\s+if=/, /mkfs/, /:$$$$\{.*\}/, /fork$$$$/]

    return !dangerousPatterns.some((pattern) => pattern.test(command))
  }
}
