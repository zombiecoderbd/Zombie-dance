import { exec } from "child_process"
import * as util from "util"
import { TerminalGuard } from "./terminalGuard"

const execPromise = util.promisify(exec)

export interface ExecutionResult {
  stdout: string
  stderr: string
  exitCode: number
  duration: number
}

export class SandboxExec {
  private static instance: SandboxExec
  private terminalGuard = TerminalGuard.getInstance()

  private maxExecutionTime = 30000 // 30 seconds
  private maxOutputSize = 1024 * 1024 // 1MB

  private constructor() {}

  static getInstance(): SandboxExec {
    if (!SandboxExec.instance) {
      SandboxExec.instance = new SandboxExec()
    }
    return SandboxExec.instance
  }

  async execute(command: string, cwd?: string, timeout?: number): Promise<ExecutionResult> {
    const startTime = Date.now()

    // Validate command safety
    if (this.terminalGuard.isDangerousCommandPattern(command)) {
      throw new Error("Command execution blocked: Potentially dangerous command detected")
    }

    try {
      const { stdout, stderr } = await execPromise(command, {
        cwd: cwd || process.cwd(),
        timeout: timeout || this.maxExecutionTime,
        maxBuffer: this.maxOutputSize,
      })

      return {
        stdout: stdout.slice(0, this.maxOutputSize),
        stderr: stderr.slice(0, this.maxOutputSize),
        exitCode: 0,
        duration: Date.now() - startTime,
      }
    } catch (error: any) {
      return {
        stdout: error.stdout?.slice(0, this.maxOutputSize) || "",
        stderr: error.stderr?.slice(0, this.maxOutputSize) || error.message,
        exitCode: error.code || 1,
        duration: Date.now() - startTime,
      }
    }
  }

  setMaxExecutionTime(milliseconds: number): void {
    if (milliseconds > 0 && milliseconds < 300000) {
      this.maxExecutionTime = milliseconds
    }
  }

  setMaxOutputSize(bytes: number): void {
    if (bytes > 0 && bytes < 10 * 1024 * 1024) {
      this.maxOutputSize = bytes
    }
  }
}
