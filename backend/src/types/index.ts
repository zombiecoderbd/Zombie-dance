export interface ChatRequest {
  prompt: string
  context: ChatContext
  model?: string
  stream?: boolean
}

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

export interface LLMMessage {
  role: "system" | "user" | "assistant"
  content: string
}
