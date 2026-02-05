export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>
  embedBatch(texts: string[]): Promise<number[][]>
}

/**
 * OpenAI Embedding Provider
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private apiKey: string
  private model = "text-embedding-3-small"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async embed(text: string): Promise<number[]> {
    const results = await this.embedBatch([text])
    return results[0]
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: texts,
          model: this.model,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = (await response.json()) as any
      return data.data.map((item: any) => item.embedding)
    } catch (error) {
      console.error("[v0] OpenAI embedding error:", error)
      throw error
    }
  }
}

/**
 * Ollama Local Embedding Provider
 */
export class OllamaEmbeddingProvider implements EmbeddingProvider {
  private baseUrl: string
  private model: string

  constructor(baseUrl = "http://localhost:11434", model = "nomic-embed-text") {
    this.baseUrl = baseUrl
    this.model = model
  }

  async embed(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: text,
        }),
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`)
      }

      const data = (await response.json()) as any
      return data.embedding
    } catch (error) {
      console.error("[v0] Ollama embedding error:", error)
      throw error
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = []

    for (const text of texts) {
      const embedding = await this.embed(text)
      results.push(embedding)
    }

    return results
  }
}

/**
 * Factory for creating embedding providers
 */
export class EmbeddingProviderFactory {
  static createProvider(type: "openai" | "ollama", config: any): EmbeddingProvider {
    switch (type) {
      case "openai":
        return new OpenAIEmbeddingProvider(config.apiKey)
      case "ollama":
        return new OllamaEmbeddingProvider(config.baseUrl, config.model)
      default:
        throw new Error(`Unknown embedding provider: ${type}`)
    }
  }
}
