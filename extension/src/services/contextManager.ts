import * as vscode from "vscode"
import type { ChatContext } from "../types"

export class ContextManager {
  private readonly SENSITIVE_PATTERNS = [
    ".env",
    ".env.*",
    "*.key",
    "*.pem",
    "secrets.json",
    "credentials.json",
    "id_rsa",
    "id_dsa",
  ]

  async extractContext(): Promise<ChatContext> {
    const context: ChatContext = {}

    // Get active editor
    const editor = vscode.window.activeTextEditor
    if (editor) {
      const document = editor.document
      const filePath = document.uri.fsPath

      // Check if file is sensitive
      if (!this.isSensitiveFile(filePath)) {
        const selection = editor.selection
        const fullContent = document.getText()

        context.activeFile = {
          path: this.getRelativePath(filePath),
          content: this.truncateContent(fullContent),
          language: document.languageId,
        }

        // Add selection if exists
        if (!selection.isEmpty) {
          const selectedText = document.getText(selection)
          context.activeFile.selection = {
            start: document.offsetAt(selection.start),
            end: document.offsetAt(selection.end),
            text: selectedText,
          }
        }
      }
    }

    // Get workspace root
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (workspaceFolders && workspaceFolders.length > 0) {
      context.workspaceRoot = workspaceFolders[0].uri.fsPath
    }

    // Get open files
    context.openFiles = vscode.window.visibleTextEditors
      .filter((e) => !this.isSensitiveFile(e.document.uri.fsPath))
      .map((e) => ({
        path: this.getRelativePath(e.document.uri.fsPath),
        language: e.document.languageId,
      }))
      .slice(0, 5) // Limit to 5 files

    // Get diagnostics (errors/warnings)
    context.diagnostics = this.extractDiagnostics()

    return context
  }

  private isSensitiveFile(filePath: string): boolean {
    const config = vscode.workspace.getConfiguration("zombie")
    const excludePatterns = config.get<string[]>("excludeSensitive", this.SENSITIVE_PATTERNS)

    return excludePatterns.some((pattern) => {
      const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\./g, "\\."))
      return regex.test(filePath)
    })
  }

  private getRelativePath(absolutePath: string): string {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspaceRoot = workspaceFolders[0].uri.fsPath
      if (absolutePath.startsWith(workspaceRoot)) {
        return absolutePath.substring(workspaceRoot.length + 1)
      }
    }
    return absolutePath
  }

  private truncateContent(content: string): string {
    const config = vscode.workspace.getConfiguration("zombie")
    const maxBytes = config.get<number>("contextSizeBytes", 20480)

    const encoder = new TextEncoder()
    const bytes = encoder.encode(content)

    if (bytes.length <= maxBytes) {
      return content
    }

    // Truncate and add marker
    const decoder = new TextDecoder()
    const truncated = decoder.decode(bytes.slice(0, maxBytes))
    return truncated + "\n\n[... content truncated due to size limit ...]"
  }

  private extractDiagnostics(): Array<{
    file: string
    message: string
    severity: string
    line: number
  }> {
    const diagnostics: Array<{
      file: string
      message: string
      severity: string
      line: number
    }> = []

    vscode.languages.getDiagnostics().forEach(([uri, fileDiagnostics]) => {
      if (this.isSensitiveFile(uri.fsPath)) {
        return
      }

      fileDiagnostics
        .filter((d) => d.severity <= vscode.DiagnosticSeverity.Warning)
        .slice(0, 3) // Limit to 3 per file
        .forEach((d) => {
          diagnostics.push({
            file: this.getRelativePath(uri.fsPath),
            message: d.message,
            severity: this.getSeverityString(d.severity),
            line: d.range.start.line + 1,
          })
        })
    })

    return diagnostics.slice(0, 10) // Limit total to 10
  }

  private getSeverityString(severity: vscode.DiagnosticSeverity): string {
    switch (severity) {
      case vscode.DiagnosticSeverity.Error:
        return "error"
      case vscode.DiagnosticSeverity.Warning:
        return "warning"
      case vscode.DiagnosticSeverity.Information:
        return "info"
      case vscode.DiagnosticSeverity.Hint:
        return "hint"
      default:
        return "unknown"
    }
  }
}
