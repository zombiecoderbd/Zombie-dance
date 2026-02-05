import { EventEmitter } from "events"
import type { Breakpoint, StackFrame, Variable, Scope } from "./types"

interface InternalDebugSession {
  id: string
  threadId: number
  state: "running" | "stopped" | "exited"
  breakpoints: Map<string, number[]>
  variables: Map<string, any>
  callStack: StackFrame[]
  currentFrame: number
}

export class DebugAdapter extends EventEmitter {
  private sessions: Map<string, InternalDebugSession> = new Map()
  private nextSessionId = 1
  private nextThreadId = 1
  private breakpointId = 1

  constructor() {
    super()
  }

  async launch(args: any): Promise<{ sessionId: string }> {
    const sessionId = `session-${this.nextSessionId++}`
    const session: InternalDebugSession = {
      id: sessionId,
      threadId: this.nextThreadId++,
      state: "running",
      breakpoints: new Map(),
      variables: new Map(),
      callStack: [],
      currentFrame: 0,
    }

    this.sessions.set(sessionId, session)
    this.emit("initialized", { sessionId })
    return { sessionId }
  }

  async setBreakpoints(sessionId: string, source: string, lines: number[]): Promise<Breakpoint[]> {
    const session = this.sessions.get(sessionId)
    if (!session) return []

    const breakpoints: Breakpoint[] = lines.map((line, index) => ({
      id: this.breakpointId++,
      verified: true,
      source,
      line,
      column: 0,
    }))

    session.breakpoints.set(source, lines)
    return breakpoints
  }

  async getStackTrace(sessionId: string, threadId: number): Promise<StackFrame[]> {
    const session = this.sessions.get(sessionId)
    if (!session) return []
    return session.callStack
  }

  async getScopes(sessionId: string, frameId: number): Promise<Scope[]> {
    return [
      {
        name: "Locals",
        variablesReference: frameId * 1000 + 1,
        expensive: false,
      },
      {
        name: "Globals",
        variablesReference: frameId * 1000 + 2,
        expensive: true,
      },
    ]
  }

  async getVariables(sessionId: string, scope: number): Promise<Variable[]> {
    const session = this.sessions.get(sessionId)
    if (!session) return []
    return Array.from(session.variables.entries()).map(([name, value]) => ({
      name,
      value: String(value),
      type: typeof value,
      variablesReference: 0,
    }))
  }

  async pause(sessionId: string, threadId: number): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.state = "stopped"
      this.emit("stopped", { sessionId, threadId, reason: "pause" })
    }
  }

  async continue(sessionId: string, threadId: number): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.state = "running"
      this.emit("continued", { sessionId, threadId })
    }
  }

  async next(sessionId: string, threadId: number): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.state = "stopped"
      this.emit("stopped", { sessionId, threadId, reason: "step" })
    }
  }

  async stepIn(sessionId: string, threadId: number): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.currentFrame = Math.min(session.currentFrame + 1, session.callStack.length - 1)
      this.emit("stopped", { sessionId, threadId, reason: "step" })
    }
  }

  async stepOut(sessionId: string, threadId: number): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.currentFrame = Math.max(session.currentFrame - 1, 0)
      this.emit("stopped", { sessionId, threadId, reason: "step" })
    }
  }

  async terminate(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.state = "exited"
      this.emit("terminated", { sessionId })
      this.sessions.delete(sessionId)
    }
  }

  getSession(sessionId: string): InternalDebugSession | undefined {
    return this.sessions.get(sessionId)
  }
}
