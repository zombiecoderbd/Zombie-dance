import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs"
import { promisify } from "util"

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const mkdir = promisify(fs.mkdir)

interface Embedding {
  id: string
  text: string
  vector: number[]
  metadata: {
    file: string
    line: number
    type: "code" | "comment" | "documentation"
  }
  timestamp: number
}

interface SearchResult {
  embedding: Embedding
  score: number
}

export class VectorStore {
  private workspaceRoot: string
  private vectorDbPath: string
  private embeddings: Map<string, Embedding> = new Map()
  private outputChannel: vscode.OutputChannel

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot
    this.vectorDbPath = path.join(workspaceRoot, ".zombiecoder", "vectordb")
    this.outputChannel = vscode.window.createOutputChannel("ZombieCoder - VectorDB")
  }

  async initialize(): Promise<void> {
    try {
      await mkdir(this.vectorDbPath, { recursive: true })
      await this.loadEmbeddings()
      this.outputChannel.appendLine("Vector store initialized successfully")
    } catch (error) {
      this.outputChannel.appendLine(`Failed to initialize vector store: ${error}`)
    }
  }

  /**
   * Simple cosine similarity calculation
   * For production, use proper embedding models
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      return 0
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    return denominator === 0 ? 0 : dotProduct / denominator
  }

  /**
   * Simple text to vector conversion
   * For production, integrate with proper embedding service like OpenAI Embeddings or Ollama
   */
  private textToVector(text: string): number[] {
    // This is a placeholder implementation
    // In production, this should call OpenAI embeddings API or local Ollama
    const hash = (str: string): number => {
      let h = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        h = (h << 5) - h + char
        h = h & h // Convert to 32bit integer
      }
      return h
    }

    const vector: number[] = []
    const dimensions = 1536 // OpenAI embedding size

    for (let i = 0; i < dimensions; i++) {
      const hashValue = hash(`${text}${i}`)
      vector.push(Math.sin(hashValue / 1000) * Math.cos(hashValue / 500))
    }

    return vector
  }

  async addEmbedding(
    id: string,
    text: string,
    metadata: {
      file: string
      line: number
      type: "code" | "comment" | "documentation"
    },
  ): Promise<void> {
    const vector = this.textToVector(text)

    const embedding: Embedding = {
      id,
      text,
      vector,
      metadata,
      timestamp: Date.now(),
    }

    this.embeddings.set(id, embedding)
    await this.saveEmbeddings()
  }

  async search(query: string, topK = 5): Promise<SearchResult[]> {
    const queryVector = this.textToVector(query)
    const results: SearchResult[] = []

    for (const embedding of this.embeddings.values()) {
      const score = this.cosineSimilarity(queryVector, embedding.vector)
      results.push({ embedding, score })
    }

    // Sort by score and return top K
    return results.sort((a, b) => b.score - a.score).slice(0, topK)
  }

  async clearAll(): Promise<void> {
    this.embeddings.clear()
    try {
      const dbFile = path.join(this.vectorDbPath, "embeddings.json")
      if (fs.existsSync(dbFile)) {
        fs.unlinkSync(dbFile)
      }
    } catch (error) {
      this.outputChannel.appendLine(`Failed to clear vector store: ${error}`)
    }
  }

  private async saveEmbeddings(): Promise<void> {
    try {
      const data = Array.from(this.embeddings.values())
      const filePath = path.join(this.vectorDbPath, "embeddings.json")
      await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
    } catch (error) {
      this.outputChannel.appendLine(`Failed to save embeddings: ${error}`)
    }
  }

  private async loadEmbeddings(): Promise<void> {
    try {
      const filePath = path.join(this.vectorDbPath, "embeddings.json")
      if (!fs.existsSync(filePath)) {
        return
      }

      const content = await readFile(filePath, "utf-8")
      const data: Embedding[] = JSON.parse(content)

      for (const embedding of data) {
        this.embeddings.set(embedding.id, embedding)
      }

      this.outputChannel.appendLine(`Loaded ${data.length} embeddings from disk`)
    } catch (error) {
      this.outputChannel.appendLine(`Failed to load embeddings: ${error}`)
    }
  }

  getStats(): {
    totalEmbeddings: number
    storageSize: string
  } {
    const totalEmbeddings = this.embeddings.size
    const estimatedSize = (totalEmbeddings * 1536 * 8) / (1024 * 1024) // Rough estimate in MB

    return {
      totalEmbeddings,
      storageSize: `${estimatedSize.toFixed(2)} MB`,
    }
  }
}
