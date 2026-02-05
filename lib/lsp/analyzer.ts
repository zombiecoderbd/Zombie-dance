import type { LSPSymbol, LSPDiagnostic, CompletionItem, HoverInfo } from "./types"
import { SymbolKind } from "vscode-languageserver-types"

export class CodeAnalyzer {
  private fileCache: Map<string, string> = new Map()

  analyzeFile(
    uri: string,
    content: string,
  ): {
    symbols: LSPSymbol[]
    diagnostics: LSPDiagnostic[]
  } {
    this.fileCache.set(uri, content)
    const symbols = this.extractSymbols(uri, content)
    const diagnostics = this.analyzeDiagnostics(content)
    return { symbols, diagnostics }
  }

  private extractSymbols(uri: string, content: string): LSPSymbol[] {
    const symbols: LSPSymbol[] = []
    const lines = content.split("\n")

    // Extract class definitions
    const classRegex = /^\s*(export\s+)?(class|interface|type)\s+(\w+)/gm
    let match
    while ((match = classRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split("\n").length - 1
      symbols.push({
        name: match[3],
        kind: match[2] === "class" ? SymbolKind.Class : SymbolKind.Interface,
        location: {
          uri,
          range: {
            start: { line: lineNumber, character: match.index },
            end: { line: lineNumber, character: match.index + match[0].length },
          },
        },
      })
    }

    // Extract function/method definitions
    const funcRegex = /^\s*(export\s+)?(async\s+)?function\s+(\w+)|^\s*(\w+)\s*$$([^)]*)$$\s*:/gm
    while ((match = funcRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split("\n").length - 1
      const name = match[3] || match[4]
      symbols.push({
        name,
        kind: SymbolKind.Function,
        location: {
          uri,
          range: {
            start: { line: lineNumber, character: match.index },
            end: { line: lineNumber, character: match.index + match[0].length },
          },
        },
      })
    }

    return symbols
  }

  private analyzeDiagnostics(content: string): LSPDiagnostic[] {
    const diagnostics: LSPDiagnostic[] = []
    const lines = content.split("\n")

    lines.forEach((line, lineIndex) => {
      // Check for unused variables
      const unusedVarRegex = /const\s+(\w+)\s*=\s*(?!console|return)/g
      let match
      while ((match = unusedVarRegex.exec(line)) !== null) {
        const isUsed = content.includes(match[1])
        if (!isUsed) {
          diagnostics.push({
            range: {
              start: { line: lineIndex, character: match.index },
              end: { line: lineIndex, character: match.index + match[0].length },
            },
            severity: 2,
            code: "unused-variable",
            message: `Variable '${match[1]}' is declared but never used`,
            source: "lsp-analyzer",
          })
        }
      }

      // Check for missing semicolons
      if (line.trim() && !line.trim().endsWith(";") && !line.trim().endsWith("{") && !line.trim().endsWith("}")) {
        diagnostics.push({
          range: {
            start: { line: lineIndex, character: line.length - 1 },
            end: { line: lineIndex, character: line.length },
          },
          severity: 3,
          code: "missing-semicolon",
          message: "Missing semicolon",
          source: "lsp-analyzer",
        })
      }
    })

    return diagnostics
  }

  getCompletions(uri: string, line: number, character: number): CompletionItem[] {
    const content = this.fileCache.get(uri)
    if (!content) return []

    const lines = content.split("\n")
    const currentLine = lines[line] || ""
    const textBeforeCursor = currentLine.substring(0, character)

    const completions: CompletionItem[] = []

    // Built-in completions
    const builtins = ["function", "const", "let", "var", "if", "else", "for", "while", "return", "async", "await"]
    builtins.forEach((keyword) => {
      if (keyword.startsWith(textBeforeCursor.split(/\s+/).pop() || "")) {
        completions.push({
          label: keyword,
          kind: 14, // Keyword
          insertText: keyword,
          sortText: `0_${keyword}`,
        })
      }
    })

    return completions
  }

  getHoverInfo(uri: string, line: number, character: number): HoverInfo | null {
    const content = this.fileCache.get(uri)
    if (!content) return null

    const lines = content.split("\n")
    const currentLine = lines[line] || ""
    const wordMatch = currentLine.substring(0, character).match(/\w+$/)
    if (!wordMatch) return null

    const word = wordMatch[0]
    return {
      contents: {
        language: "typescript",
        value: `Symbol: ${word}\nFound in: ${uri}`,
      },
    }
  }
}
