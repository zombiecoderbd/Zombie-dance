import * as vscode from "vscode"
import type { TerminalPermissionRequest, TerminalPermissionResponse } from "../types/agents"

export class TerminalGuard {
  private static instance: TerminalGuard
  private sessionPermissions: Set<string> = new Set()
  private alwaysAllowedPatterns: string[] = ["npm install", "pip install", "yarn add"]
  private blockedPatterns: string[] = ["rm -rf /", "dd if=/dev/zero", "mkfs", ":(){:|:&};:", "fork()$"]

  private constructor() {}

  static getInstance(): TerminalGuard {
    if (!TerminalGuard.instance) {
      TerminalGuard.instance = new TerminalGuard()
    }
    return TerminalGuard.instance
  }

  async requestPermission(request: TerminalPermissionRequest): Promise<TerminalPermissionResponse> {
    // Check if already allowed in this session
    if (this.sessionPermissions.has(request.command)) {
      return {
        allowed: true,
        scope: "session",
      }
    }

    // Check dangerous patterns
    if (this.isDangerousCommandPattern(request.command)) {
      return {
        allowed: false,
        scope: "deny",
        reason: "Command contains dangerous patterns",
      }
    }

    // Show permission dialog
    const riskEmoji = request.riskLevel === "high" ? "🚨" : request.riskLevel === "medium" ? "⚠️" : "ℹ️"

    const result = await vscode.window.showInformationMessage(
      `${riskEmoji} ZombieCursor wants to run a terminal command`,
      {
        modal: true,
        detail: `Command: ${request.command}\n\nDescription: ${request.description || "No description provided"}\n\nRisk Level: ${request.riskLevel.toUpperCase()}`,
      },
      "Allow Once",
      "Allow for This Session",
      "Deny",
    )

    if (result === "Allow Once") {
      return {
        allowed: true,
        scope: "once",
      }
    } else if (result === "Allow for This Session") {
      this.sessionPermissions.add(request.command)
      return {
        allowed: true,
        scope: "session",
      }
    } else {
      return {
        allowed: false,
        scope: "deny",
        reason: "User denied permission",
      }
    }
  }

  isDangerousCommandPattern(command: string): boolean {
    // Check against blocked patterns
    for (const pattern of this.blockedPatterns) {
      const regex = new RegExp(pattern, "i")
      if (regex.test(command)) {
        return true
      }
    }

    return false
  }

  clearSessionPermissions(): void {
    this.sessionPermissions.clear()
  }

  addAllowedPattern(pattern: string): void {
    this.alwaysAllowedPatterns.push(pattern)
  }

  removeAllowedPattern(pattern: string): void {
    const index = this.alwaysAllowedPatterns.indexOf(pattern)
    if (index > -1) {
      this.alwaysAllowedPatterns.splice(index, 1)
    }
  }
}
