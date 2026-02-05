import { type AgentResponse, type DanceCommand, type EditorContext, AgentType } from "../types/agents"

export class CoderAgent {
  private static instance: CoderAgent

  private constructor() {}

  static getInstance(): CoderAgent {
    if (!CoderAgent.instance) {
      CoderAgent.instance = new CoderAgent()
    }
    return CoderAgent.instance
  }

  async processRequest(query: string, context?: EditorContext): Promise<AgentResponse> {
    try {
      // Generate dance commands for code editing
      const commands = this.generateDanceCommands(query, context)

      return {
        agentType: AgentType.CODER,
        mode: "edit",
        content: `Processing: ${query}`,
        commands,
        requiresPermission: false,
      }
    } catch (error) {
      throw new Error(`Coder Agent Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private generateDanceCommands(query: string, context?: EditorContext): DanceCommand[] {
    const commands: DanceCommand[] = []

    if (context?.lineNumber) {
      // Move cursor to relevant line
      commands.push({
        action: "move_cursor",
        line: context.lineNumber,
        column: context.columnNumber || 0,
        duration: 300,
      })

      // Highlight the target area
      commands.push({
        action: "highlight",
        line: context.lineNumber,
        endLine: context.lineNumber + 5,
        duration: 200,
      })
    }

    return commands
  }

  async explainCode(selectedText: string, context?: EditorContext): Promise<string> {
    // AI explains the selected code
    return `Analyzing code:\n${selectedText}`
  }

  async refactorCode(selectedText: string, context?: EditorContext): Promise<DanceCommand[]> {
    // Generate refactoring suggestions as dance commands
    return [
      {
        action: "highlight",
        line: context?.lineNumber || 0,
        endLine: (context?.lineNumber || 0) + 10,
      },
    ]
  }

  async optimizeCode(selectedText: string): Promise<DanceCommand[]> {
    // Generate optimization commands
    return [
      {
        action: "move_cursor",
        line: 0,
        column: 0,
      },
    ]
  }
}
