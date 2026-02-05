import { AgentType, type AgentRequest, type AgentResponse } from "../types/agents"
import { CoderAgent } from "./coderAgent"
import { TerminalAgent } from "./terminalAgent"
import { RAGAgent } from "./ragAgent"

export class AgentRouter {
  private static instance: AgentRouter
  private coderAgent = CoderAgent.getInstance()
  private terminalAgent = TerminalAgent.getInstance()
  private ragAgent = RAGAgent.getInstance()

  private constructor() {}

  static getInstance(): AgentRouter {
    if (!AgentRouter.instance) {
      AgentRouter.instance = new AgentRouter()
    }
    return AgentRouter.instance
  }

  async routeRequest(request: AgentRequest): Promise<AgentResponse> {
    switch (request.agentType) {
      case AgentType.CODER:
        return this.coderAgent.processRequest(request.query, request.context)

      case AgentType.TERMINAL:
        return this.terminalAgent.processRequest(request.query)

      case AgentType.RAG:
        return this.ragAgent.processRequest(request.query, request.context?.workspaceRoot)

      default:
        throw new Error(`Unknown agent type: ${request.agentType}`)
    }
  }
}
