export interface LLMProvider {
  chat(messages: Array<{ role: string; content: string }>): AsyncGenerator<string>
  listModels(): Promise<string[]>
  validateConnection(): Promise<boolean>
}

/**
 * OpenAI Provider
 */
export class OpenAIProvider implements LLMProvider {
  private apiKey: string
  private baseUrl = "https://api.openai.com/v1"
  private model: string

  constructor(apiKey: string, model = "gpt-4") {
    this.apiKey = apiKey
    this.model = model
  }

  async *chat(messages: Array<{ role: string; content: string }>): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")

      buffer = lines[lines.length - 1]

      for (const line of lines.slice(0, -1)) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim()
          if (data === "[DONE]") continue

          try {
            const json = JSON.parse(data)
            const content = json.choices[0]?.delta?.content || ""
            if (content) yield content
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) throw new Error("Failed to fetch models")

    const data = (await response.json()) as any
    return data.data.map((m: any) => m.id).filter((id: string) => id.includes("gpt"))
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}

/**
 * Anthropic Provider
 */
export class AnthropicProvider implements LLMProvider {
  private apiKey: string
  private baseUrl = "https://api.anthropic.com"
  private model: string

  constructor(apiKey: string, model = "claude-3-opus-20240229") {
    this.apiKey = apiKey
    this.model = model
  }

  async *chat(messages: Array<{ role: string; content: string }>): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        stream: true,
        messages,
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")

      buffer = lines[lines.length - 1]

      for (const line of lines.slice(0, -1)) {
        if (line.startsWith("data: ")) {
          try {
            const json = JSON.parse(line.slice(6))
            if (json.type === "content_block_delta" && json.delta.type === "text_delta") {
              yield json.delta.text
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    return ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"]
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: {
          "x-api-key": this.apiKey,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}

/**
 * Ollama Provider (Local)
 */
export class OllamaProvider implements LLMProvider {
  private baseUrl: string
  private model: string

  constructor(baseUrl = "http://localhost:11434", model = "llama2") {
    this.baseUrl = baseUrl
    this.model = model
  }

  async *chat(messages: Array<{ role: string; content: string }>): AsyncGenerator<string> {
    const formattedMessages = messages.map((m) => `${m.role}: ${m.content}`).join("\n")

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        prompt: formattedMessages,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value)
      const lines = text.split("\n").filter((l) => l.trim())

      for (const line of lines) {
        try {
          const json = JSON.parse(line)
          if (json.response) yield json.response
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      const data = (await response.json()) as any
      return data.models.map((m: any) => m.name)
    } catch {
      return ["llama2"]
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }
}

/**
 * Factory for creating LLM providers
 */
export class LLMProviderFactory {
  static createProvider(type: "openai" | "anthropic" | "ollama", config: any): LLMProvider {
    switch (type) {
      case "openai":
        return new OpenAIProvider(config.apiKey, config.model)
      case "anthropic":
        return new AnthropicProvider(config.apiKey, config.model)
      case "ollama":
        return new OllamaProvider(config.baseUrl, config.model)
      default:
        throw new Error(`Unknown LLM provider: ${type}`)
    }
  }

  static async detectAvailableProviders(): Promise<string[]> {
    const available: string[] = []

    // Check Ollama
    try {
      const ollamaProvider = new OllamaProvider()
      if (await ollamaProvider.validateConnection()) {
        available.push("ollama")
      }
    } catch (e) {
      // Ollama not available
    }

    return available
  }
}
