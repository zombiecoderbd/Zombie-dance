import type { ILLMService, LLMRequest, LLMResponse } from "../interfaces"

export class OllamaService implements ILLMService {
  private endpoint: string
  private timeout = 30000

  constructor(endpoint: string) {
    this.endpoint = endpoint.replace(/\/$/, "") // Remove trailing slash
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`, { signal: AbortSignal.timeout(this.timeout) })
      return response.ok
    } catch {
      return false
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`, { signal: AbortSignal.timeout(this.timeout) })
      if (!response.ok) return []
      const data = await response.json()
      return data.models?.map((m: any) => m.name) || []
    } catch {
      return []
    }
  }

  async generateText(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: request.model,
          prompt: request.context ? `${request.context}\n${request.prompt}` : request.prompt,
          temperature: request.temperature ?? 0.7,
          stream: false,
        }),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        return { text: "", model: request.model, error: `HTTP ${response.status}` }
      }

      const data = await response.json()
      return {
        text: data.response || "",
        model: request.model,
        usage: {
          promptTokens: data.prompt?.length || 0,
          completionTokens: data.response?.length || 0,
          totalTokens: (data.prompt?.length || 0) + (data.response?.length || 0),
        },
      }
    } catch (error) {
      return {
        text: "",
        model: request.model,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
