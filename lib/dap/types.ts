export interface DebugSession {
  id: string
  name: string
  type: string
  request: "launch" | "attach"
  program: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  stopOnEntry?: boolean
  console?: "integratedTerminal" | "externalTerminal" | "internalConsole"
}

export interface Breakpoint {
  id: number
  verified: boolean
  source: string
  line: number
  column?: number
  endLine?: number
  endColumn?: number
  message?: string
  instructionReference?: string
  condition?: string
  hitCondition?: string
  logMessage?: string
}

export interface StackFrame {
  id: number
  name: string
  source?: {
    name: string
    path: string
  }
  line: number
  column?: number
  endLine?: number
  endColumn?: number
  canRestart?: boolean
  instructionPointerReference?: string
  moduleId?: number | string
  presentationHint?: string
}

export interface Scope {
  name: string
  presentationHint?: string
  variablesReference: number
  namedVariables?: number
  indexedVariables?: number
  expensive: boolean
}

export interface Variable {
  name: string
  value: string
  type?: string
  presentationHint?: any
  evaluateName?: string
  variablesReference?: number
  namedVariables?: number
  indexedVariables?: number
  memoryReference?: string
}

export interface ThreadInfo {
  id: number
  name: string
}
