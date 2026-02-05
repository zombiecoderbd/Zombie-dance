import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs"
import type { VectorStore } from "../vectordb/vectorStore"
import type { EmbeddingProvider } from "../vectordb/embeddingService"

interface CodeFile {
  path: string
  content: string
  language: string
}

interface RAGContext {
  relevantFiles: Array<{
    file: string
    snippet: string
    line: number
    relevance: number
  }>
  query: string
  timestamp: number
}

export class RAGEngine {
  private vectorStore: VectorStore
  private embeddingProvider: EmbeddingProvider
  private workspaceRoot: string
  private outputChannel: vscode.OutputChannel
  private indexedFiles: Set<string> = new Set()

  constructor(workspaceRoot: string, vectorStore: VectorStore, embeddingProvider: EmbeddingProvider) {
    this.workspaceRoot = workspaceRoot
    this.vectorStore = vectorStore
    this.embeddingProvider = embeddingProvider
    this.outputChannel = vscode.window.createOutputChannel("ZombieCoder - RAG")
  }

  /**
   * Index the entire workspace
   */
  async indexWorkspace(progress?: vscode.Progress<{ message?: string; increment?: number }>): Promise<void> {
    try {
      this.outputChannel.appendLine("Starting workspace indexing...")

      const files = await this.findCodeFiles(this.workspaceRoot)
      const total = files.length

      this.outputChannel.appendLine(`Found ${total} code files to index`)

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        progress?.report({
          message: `Indexing: ${path.relative(this.workspaceRoot, file.path)}`,
          increment: (1 / total) * 100,
        })

        await this.indexFile(file)
      }

      this.outputChannel.appendLine(`Workspace indexing completed. Indexed ${this.indexedFiles.size} files`)
    } catch (error) {
      this.outputChannel.appendLine(`Indexing error: ${error}`)
      throw error
    }
  }

  /**
   * Index a single file
   */
  async indexFile(file: CodeFile): Promise<void> {
    try {
      const chunks = this.chunkCode(file.content, file.path)

      for (const chunk of chunks) {
        const id = `${file.path}:${chunk.line}`

        await this.vectorStore.addEmbedding(id, chunk.content, {
          file: file.path,
          line: chunk.line,
          type: chunk.type,
        })
      }

      this.indexedFiles.add(file.path)
    } catch (error) {
      this.outputChannel.appendLine(`Failed to index file ${file.path}: ${error}`)
    }
  }

  /**
   * Find all code files in workspace
   */
  private async findCodeFiles(dir: string, files: CodeFile[] = []): Promise<CodeFile[]> {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    const excludePatterns = ["node_modules", ".git", "dist", "build", ".zombiecoder", "venv", "__pycache__"]

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (excludePatterns.some((pattern) => entry.name.includes(pattern))) {
        continue
      }

      if (entry.isDirectory()) {
        await this.findCodeFiles(fullPath, files)
      } else if (this.isCodeFile(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8")
          const language = this.getLanguage(entry.name)

          files.push({
            path: fullPath,
            content,
            language,
          })
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }

    return files
  }

  /**
   * Split code into semantic chunks
   */
  private chunkCode(content: string, filePath: string): Array<{ content: string; line: number; type: string }> {
    const lines = content.split("\n")
    const chunks: Array<{ content: string; line: number; type: string }> = []

    let currentChunk = ""
    let startLine = 0
    let inComment = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Track comments
      if (line.trim().startsWith("/*")) {
        inComment = true
      }

      currentChunk += line + "\n"

      // Create chunk every 20 lines or at function/class boundaries
      const isFunctionStart = /^(function|class|export|async|const.*=.*=>|def\s)/.test(line.trim())
      const isModuleStatement = /^(import|require|from)/.test(line.trim())

      if (inComment && line.trim().endsWith("*/")) {
        inComment = false
      }

      if ((currentChunk.split("\n").length > 20 || isFunctionStart || isModuleStatement) && currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          line: startLine,
          type: inComment ? "comment" : isFunctionStart ? "code" : "documentation",
        })

        currentChunk = ""
        startLine = i + 1
      }
    }

    // Add remaining chunk
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        line: startLine,
        type: "code",
      })
    }

    return chunks
  }

  /**
   * Retrieve relevant context for a query
   */
  async retrieveContext(query: string, topK = 5): Promise<RAGContext> {
    try {
      const results = await this.vectorStore.search(query, topK)

      const relevantFiles = results.map((result) => ({
        file: result.embedding.metadata.file,
        snippet: result.embedding.text,
        line: result.embedding.metadata.line,
        relevance: result.score,
      }))

      return {
        relevantFiles,
        query,
        timestamp: Date.now(),
      }
    } catch (error) {
      this.outputChannel.appendLine(`Context retrieval error: ${error}`)
      throw error
    }
  }

  /**
   * Format context for LLM
   */
  formatContextForLLM(context: RAGContext): string {
    if (context.relevantFiles.length === 0) {
      return "No relevant code context found."
    }

    let formatted = "## Relevant Code Context\n\n"

    for (const file of context.relevantFiles) {
      formatted += `### ${path.basename(file.file)} (Relevance: ${(file.relevance * 100).toFixed(1)}%)\n\`\`\`\n${file.snippet}\n\`\`\`\n\n`
    }

    return formatted
  }

  private isCodeFile(filename: string): boolean {
    const codeExtensions = [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".py",
      ".java",
      ".cpp",
      ".c",
      ".rs",
      ".go",
      ".rb",
      ".php",
      ".html",
      ".css",
      ".scss",
      ".json",
      ".yaml",
      ".yml",
      ".xml",
      ".sql",
    ]

    return codeExtensions.some((ext) => filename.endsWith(ext))
  }

  private getLanguage(filename: string): string {
    const ext = path.extname(filename).toLowerCase()

    const languageMap: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "javascript",
      ".jsx": "javascript",
      ".py": "python",
      ".java": "java",
      ".cpp": "cpp",
      ".c": "c",
      ".rs": "rust",
      ".go": "go",
      ".rb": "ruby",
      ".php": "php",
      ".html": "html",
      ".css": "css",
      ".scss": "scss",
      ".json": "json",
      ".yaml": "yaml",
      ".yml": "yaml",
      ".xml": "xml",
      ".sql": "sql",
    }

    return languageMap[ext] || "unknown"
  }

  getIndexStats(): {
    indexedFiles: number
    totalEmbeddings: number
    storageUsage: string
  } {
    const stats = this.vectorStore.getStats()

    return {
      indexedFiles: this.indexedFiles.size,
      totalEmbeddings: stats.totalEmbeddings,
      storageUsage: stats.storageSize,
    }
  }
}
