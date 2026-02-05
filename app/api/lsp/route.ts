import { type NextRequest, NextResponse } from "next/server"
import { CodeAnalyzer } from "@/lib/lsp/analyzer"

const analyzer = new CodeAnalyzer()

export async function POST(request: NextRequest) {
  try {
    const { method, params } = await request.json()

    switch (method) {
      case "textDocument/didOpen":
        const { uri, languageId, version, text } = params.textDocument
        analyzer.analyzeFile(uri, text)
        return NextResponse.json({ status: "ok" })

      case "textDocument/completion":
        const { textDocument, position } = params
        const completions = analyzer.getCompletions(textDocument.uri, position.line, position.character)
        return NextResponse.json({ items: completions })

      case "textDocument/hover":
        const hoverParams = params
        const hoverInfo = analyzer.getHoverInfo(
          hoverParams.textDocument.uri,
          hoverParams.position.line,
          hoverParams.position.character,
        )
        return NextResponse.json(hoverInfo || {})

      default:
        return NextResponse.json({ error: "Unknown method" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] LSP Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
