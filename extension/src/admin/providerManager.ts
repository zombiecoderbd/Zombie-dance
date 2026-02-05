import type * as vscode from "vscode"
import { LLMProviderFactory } from "../llm/llmProvider"

export interface ProviderConfig {
  id: string
  name: string
  type: "ollama" | "openai" | "anthropic"
  endpoint?: string
  apiKey?: string
  model: string
  priority: number
  enabled: boolean
  testResult?: {
    success: boolean
    message: string
    timestamp: number
    responseTime?: number
  }
}

export class ProviderManager {
  private static instance: ProviderManager
  private providers: Map<string, ProviderConfig> = new Map()
  private defaultProvider = "ollama"

  private constructor() {}

  static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager()
    }
    return ProviderManager.instance
  }

  async initialize(context: vscode.ExtensionContext): Promise<void> {
    // Set Ollama as default provider
    await this.initializeDefaultProviders(context)
  }

  private async initializeDefaultProviders(context: vscode.ExtensionContext): Promise<void> {
    const ollamaConfig: ProviderConfig = {
      id: "ollama-local",
      name: "Ollama (Local)",
      type: "ollama",
      endpoint: "http://localhost:11434",
      model: "llama2",
      priority: 1,
      enabled: true,
    }

    this.providers.set("ollama-local", ollamaConfig)

    // Add OpenAI as secondary option (disabled by default)
    const openaiConfig: ProviderConfig = {
      id: "openai-gpt4",
      name: "OpenAI GPT-4",
      type: "openai",
      model: "gpt-4",
      priority: 2,
      enabled: false,
    }

    this.providers.set("openai-gpt4", openaiConfig)

    // Add Anthropic as tertiary option (disabled by default)
    const anthropicConfig: ProviderConfig = {
      id: "anthropic-claude",
      name: "Anthropic Claude",
      type: "anthropic",
      model: "claude-3-opus-20240229",
      priority: 3,
      enabled: false,
    }

    this.providers.set("anthropic-claude", anthropicConfig)

    // Verify Ollama is available on startup
    await this.testConnection("ollama-local")
  }

  getProviders(): ProviderConfig[] {
    return Array.from(this.providers.values()).sort((a, b) => a.priority - b.priority)
  }

  getDefaultProvider(): ProviderConfig | undefined {
    return this.providers.get(this.defaultProvider)
  }

  setDefaultProvider(id: string): void {
    if (!this.providers.has(id)) throw new Error(`Provider ${id} not found`)
    this.defaultProvider = id
  }

  async testConnection(id: string): Promise<void> {
    const config = this.providers.get(id)
    if (!config) throw new Error(`Provider ${id} not found`)

    try {
      const startTime = Date.now()
      const provider = LLMProviderFactory.createProvider(config.type, {
        baseUrl: config.endpoint,
        apiKey: config.apiKey,
        model: config.model,
      })

      const isValid = await provider.validateConnection()
      const responseTime = Date.now() - startTime

      config.testResult = {
        success: isValid,
        message: isValid ? "Connection successful" : "Connection failed",
        timestamp: Date.now(),
        responseTime,
      }
    } catch (error) {
      config.testResult = {
        success: false,
        message: `Error: ${error}`,
        timestamp: Date.now(),
      }
      throw error
    }
  }

  async addProvider(config: Omit<ProviderConfig, "id">): Promise<string> {
    const id = `${config.type}-${Date.now()}`
    const newConfig: ProviderConfig = { ...config, id }

    // Test connection before adding
    const provider = LLMProviderFactory.createProvider(config.type, {
      baseUrl: config.endpoint,
      apiKey: config.apiKey,
      model: config.model,
    })

    if (!(await provider.validateConnection())) {
      throw new Error("Failed to validate provider connection")
    }

    this.providers.set(id, newConfig)
    return id
  }

  async updateProvider(id: string, updates: Partial<ProviderConfig>): Promise<void> {
    const config = this.providers.get(id)
    if (!config) throw new Error(`Provider ${id} not found`)

    Object.assign(config, updates)

    // Test connection if endpoint or apiKey changed
    if (updates.endpoint || updates.apiKey || updates.model) {
      await this.testConnection(id)
    }
  }

  async removeProvider(id: string): Promise<void> {
    if (id === this.defaultProvider) {
      throw new Error("Cannot remove the default provider")
    }
    this.providers.delete(id)
  }
}
