import { getDatabase } from "../db/sqlite"
import { OllamaService } from "./services/ollamaService"
import { OpenAIService } from "./services/openaiService"
import type { ILLMService } from "./interfaces"

export class LLMFactory {
  static createService(modelId: number): ILLMService | null {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT name, provider, endpoint, apiKey 
      FROM models 
      WHERE id = ? AND isActive = 1
    `)

    const model = stmt.get(modelId) as any

    if (!model) return null

    if (model.provider === "ollama") {
      return new OllamaService(model.endpoint || "http://localhost:11434")
    }

    if (model.provider === "openai") {
      return new OpenAIService(model.endpoint || "https://api.openai.com/v1", model.apiKey || "")
    }

    return null
  }

  static getDefaultService(): ILLMService | null {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT id FROM models 
      WHERE isDefault = 1 AND isActive = 1 
      LIMIT 1
    `)

    const model = stmt.get() as any
    return model ? this.createService(model.id) : null
  }
}
