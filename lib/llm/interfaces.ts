export interface LLMProvider {
  name: string
  endpoint: string
  apiKey?: string
}

export interface LLMRequest {
  prompt: string
  model: string
  temperature?: number
  maxTokens?: number
  context?: string
}

export interface LLMResponse {
  text: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  error?: string
}

export interface ILLMService {
  generateText(request: LLMRequest): Promise<LLMResponse>
  getAvailableModels(): Promise<string[]>
  validateConnection(): Promise<boolean>
}
