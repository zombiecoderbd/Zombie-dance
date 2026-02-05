import type { SymbolKind } from "vscode-languageserver-types"

export interface LSPSymbol {
  name: string
  kind: SymbolKind
  location: {
    uri: string
    range: {
      start: { line: number; character: number }
      end: { line: number; character: number }
    }
  }
  containerName?: string
}

export interface LSPDiagnostic {
  range: {
    start: { line: number; character: number }
    end: { line: number; character: number }
  }
  severity: 1 | 2 | 3 | 4
  code?: string
  message: string
  source?: string
  relatedInformation?: Array<{
    location: { uri: string; range: any }
    message: string
  }>
}

export interface CompletionItem {
  label: string
  kind?: number
  detail?: string
  documentation?: string
  sortText?: string
  insertText?: string
  insertTextFormat?: number
  commitCharacters?: string[]
  additionalTextEdits?: Array<{
    range: any
    newText: string
  }>
  command?: {
    title: string
    command: string
    arguments?: any[]
  }
}

export interface HoverInfo {
  contents: string | { language: string; value: string }
  range?: any
}
