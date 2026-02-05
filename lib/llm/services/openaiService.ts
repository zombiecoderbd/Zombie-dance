import type { ILLMService, LLMRequest, LLMResponse } from "../interfaces"

export class OpenAIService implements ILLMService {
  private endpoint: string
  private apiKey: string
  private timeout = 30000

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint.replace(/\/$/, "")
    this.apiKey = apiKey
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(this.timeout),
      })
      return response.ok
    } catch {
      return false
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.endpoint}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(this.timeout),
      })
      if (!response.ok) return []
      const data = await response.json()
      return data.data?.map((m: any) => m.id) || []
    } catch {
      return []
    }
  }

  async generateText(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.model,
          messages: [
            ...(request.context ? [{ role: "system", content: request.context }] : []),
            { role: "user", content: request.prompt },
          ],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 2000,
        }),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        return { text: "", model: request.model, error: `HTTP ${response.status}` }
      }

      const data = await response.json()
      return {
        text: data.choices?.[0]?.message?.content || "",
        model: request.model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
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
