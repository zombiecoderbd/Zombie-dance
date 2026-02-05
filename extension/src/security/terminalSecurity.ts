import * as vscode from "vscode"
import { spawn } from "child_process"

interface DangerousCommand {
  pattern: RegExp
  severity: "critical" | "high" | "medium"
  reason: string
}

export class TerminalSecurityManager {
  private dangerousCommands: DangerousCommand[] = [
    {
      pattern: /^(rm|del)\s+-[rf]*\s+\/(?:etc|sys|bin|lib|boot|dev|proc)/,
      severity: "critical",
      reason: "Attempting to delete system files",
    },
    {
      pattern: /dd\s+if=\/dev\/zero\s+of=/,
      severity: "critical",
      reason: "Potential disk wipe operation",
    },
    {
      pattern: /mkfs\.|fsck|fdisk|cfdisk/,
      severity: "critical",
      reason: "Filesystem manipulation detected",
    },
    {
      pattern: /sudo\s+.*chmod\s+777/,
      severity: "high",
      reason: "Unrestricted permission change attempted",
    },
    {
      pattern: /curl|wget.*\|\s*bash|sh/,
      severity: "high",
      reason: "Unsafe remote execution detected",
    },
    {
      pattern: /npm\s+install.*--global|yarn\s+global\s+add/,
      severity: "medium",
      reason: "Global package installation",
    },
  ]

  /**
   * Analyze command for security risks
   */
  analyzeCommand(command: string): {
    safe: boolean
    warnings: Array<{ severity: string; reason: string }>
  } {
    const warnings: Array<{ severity: string; reason: string }> = []

    for (const dangerous of this.dangerousCommands) {
      if (dangerous.pattern.test(command)) {
        warnings.push({
          severity: dangerous.severity,
          reason: dangerous.reason,
        })
      }
    }

    return {
      safe: warnings.length === 0,
      warnings,
    }
  }

  /**
   * Request user permission before executing dangerous command
   */
  async requestPermission(command: string, warnings: Array<{ severity: string; reason: string }>): Promise<boolean> {
    const warningText = warnings.map((w) => `[${w.severity.toUpperCase()}] ${w.reason}`).join("\n")

    const message = `⚠️ Security Warning:\n\n${warningText}\n\nCommand: ${command}\n\nDo you want to proceed?`

    const result = await vscode.window.showWarningMessage(message, "Execute", "Cancel")

    return result === "Execute"
  }

  /**
   * Safely execute command with sandboxing
   */
  async executeCommand(command: string, cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const process = spawn("sh", ["-c", command], {
        cwd,
        timeout: 30000, // 30 second timeout
        shell: true,
      })

      let stdout = ""
      let stderr = ""

      process.stdout.on("data", (data) => {
        stdout += data.toString()
      })

      process.stderr.on("data", (data) => {
        stderr += data.toString()
      })

      process.on("close", (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
        })
      })

      process.on("error", (error) => {
        resolve({
          stdout,
          stderr: error.message,
          exitCode: 1,
        })
      })
    })
  }
}

/**
 * Terminal Command Handler with Safety Layer
 */
export class SafeTerminalExecutor {
  private securityManager: TerminalSecurityManager
  private outputChannel: vscode.OutputChannel
  private permissionCache: Map<string, boolean> = new Map()

  constructor() {
    this.securityManager = new TerminalSecurityManager()
    this.outputChannel = vscode.window.createOutputChannel("ZombieCoder - Terminal")
  }

  async execute(command: string, cwd: string): Promise<{ success: boolean; output: string; error?: string }> {
    try {
      // Analyze command
      const analysis = this.securityManager.analyzeCommand(command)

      // If dangerous, request permission
      if (!analysis.safe) {
        const cached = this.permissionCache.get(command)

        let allowed = cached || false

        if (cached === undefined) {
          allowed = await this.securityManager.requestPermission(command, analysis.warnings)
          this.permissionCache.set(command, allowed)
        }

        if (!allowed) {
          return {
            success: false,
            output: "",
            error: "Command execution denied by security policy",
          }
        }
      }

      // Execute safely
      const result = await this.securityManager.executeCommand(command, cwd)

      this.outputChannel.appendLine(`Command: ${command}`)
      if (result.stdout) this.outputChannel.appendLine(`Output: ${result.stdout}`)
      if (result.stderr) this.outputChannel.appendLine(`Error: ${result.stderr}`)

      return {
        success: result.exitCode === 0,
        output: result.stdout,
        error: result.stderr,
      }
    } catch (error) {
      return {
        success: false,
        output: "",
        error: String(error),
      }
    }
  }

  clearPermissionCache(): void {
    this.permissionCache.clear()
  }
}
