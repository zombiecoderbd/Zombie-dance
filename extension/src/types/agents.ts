// Agent Types and Interfaces

export enum AgentType {
  CODER = "coder",
  TERMINAL = "terminal",
  RAG = "rag",
}

export interface AgentRequest {
  agentType: AgentType
  query: string
  context?: EditorContext
  historyId?: string
}

export interface AgentResponse {
  agentType: AgentType
  mode: "edit" | "command" | "search"
  content: string
  commands?: DanceCommand[]
  requiresPermission?: boolean
  permissionType?: "terminal" | "file-modify"
}

export interface EditorContext {
  activeFile?: string
  selectedText?: string
  filePath?: string
  fileContent?: string
  lineNumber?: number
  columnNumber?: number
  workspaceRoot?: string
  openFiles?: string[]
}

export interface DanceCommand {
  action: "move_cursor" | "insert_text" | "highlight" | "delete_text" | "replace_text"
  line?: number
  column?: number
  text?: string
  endLine?: number
  endColumn?: number
  duration?: number
}

export interface TerminalPermissionRequest {
  command: string
  description: string
  riskLevel: "low" | "medium" | "high"
  workingDirectory?: string
}

export interface TerminalPermissionResponse {
  allowed: boolean
  scope: "once" | "session" | "deny"
  reason?: string
}
