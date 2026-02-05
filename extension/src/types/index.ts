export interface ChatContext {
  activeFile?: {
    path: string
    content: string
    language: string
    selection?: {
      start: number
      end: number
      text: string
    }
  }
  workspaceRoot?: string
  openFiles?: Array<{
    path: string
    language: string
  }>
  diagnostics?: Array<{
    file: string
    message: string
    severity: string
    line: number
  }>
}

export interface StreamResponse {
  type: "token" | "diff" | "error" | "done"
  content?: string
  diff?: {
    id: string
    filePath: string
    patch: string
    description?: string
  }
  error?: string
}

export interface DiffProposal {
  id: string
  filePath: string
  patch: string
  description?: string
  timestamp: number
  applied: boolean
}

export interface ZombieConfig {
  endpoint: string
  model: string
  contextSizeBytes: number
  excludeSensitive: string[]
  streamTransport: "sse" | "websocket"
  autosaveOnApply: boolean
  enableInlineCompletions: boolean
}
