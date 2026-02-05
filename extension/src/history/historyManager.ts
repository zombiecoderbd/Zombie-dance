import * as fs from "fs"
import * as path from "path"
import * as os from "os"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface ChatHistory {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  projectPath?: string
}

export class HistoryManager {
  private static instance: HistoryManager
  private historyDir: string
  private histories: Map<string, ChatHistory> = new Map()

  private constructor() {
    // Store history in ~/.zombiecursor/data/
    this.historyDir = path.join(os.homedir(), ".zombiecursor", "data", "history")
    this.ensureDirectoryExists()
    this.loadHistories()
  }

  static getInstance(): HistoryManager {
    if (!HistoryManager.instance) {
      HistoryManager.instance = new HistoryManager()
    }
    return HistoryManager.instance
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true })
    }
  }

  private loadHistories(): void {
    try {
      if (!fs.existsSync(this.historyDir)) {
        return
      }

      const files = fs.readdirSync(this.historyDir).filter((f) => f.endsWith(".json"))

      for (const file of files) {
        const content = fs.readFileSync(path.join(this.historyDir, file), "utf-8")
        const history: ChatHistory = JSON.parse(content)
        this.histories.set(history.id, history)
      }
    } catch (error) {
      console.error("Failed to load history:", error)
    }
  }

  async createHistory(title = "New Chat", projectPath?: string): Promise<ChatHistory> {
    const id = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const history: ChatHistory = {
      id,
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      projectPath,
    }

    this.histories.set(id, history)
    await this.saveHistory(history)

    return history
  }

  async addMessage(historyId: string, message: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage> {
    const history = this.histories.get(historyId)
    if (!history) {
      throw new Error(`History not found: ${historyId}`)
    }

    const chatMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }

    history.messages.push(chatMessage)
    history.updatedAt = Date.now()

    await this.saveHistory(history)
    return chatMessage
  }

  async renameHistory(historyId: string, newTitle: string): Promise<void> {
    const history = this.histories.get(historyId)
    if (!history) {
      throw new Error(`History not found: ${historyId}`)
    }

    history.title = newTitle
    history.updatedAt = Date.now()

    await this.saveHistory(history)
  }

  async deleteMessage(historyId: string, messageId: string): Promise<void> {
    const history = this.histories.get(historyId)
    if (!history) {
      throw new Error(`History not found: ${historyId}`)
    }

    history.messages = history.messages.filter((m) => m.id !== messageId)
    history.updatedAt = Date.now()

    await this.saveHistory(history)
  }

  async deleteHistory(historyId: string): Promise<void> {
    const history = this.histories.get(historyId)
    if (!history) {
      throw new Error(`History not found: ${historyId}`)
    }

    this.histories.delete(historyId)

    const filePath = path.join(this.historyDir, `${historyId}.json`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }

  async getHistory(historyId: string): Promise<ChatHistory | undefined> {
    return this.histories.get(historyId)
  }

  async getAllHistories(): Promise<ChatHistory[]> {
    return Array.from(this.histories.values()).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async searchHistories(query: string): Promise<ChatHistory[]> {
    const lowerQuery = query.toLowerCase()

    return Array.from(this.histories.values())
      .filter(
        (h) =>
          h.title.toLowerCase().includes(lowerQuery) ||
          h.messages.some((m) => m.content.toLowerCase().includes(lowerQuery)),
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async exportHistory(historyId: string): Promise<string> {
    const history = this.histories.get(historyId)
    if (!history) {
      throw new Error(`History not found: ${historyId}`)
    }

    return JSON.stringify(history, null, 2)
  }

  async importHistory(jsonData: string): Promise<ChatHistory> {
    const history: ChatHistory = JSON.parse(jsonData)

    if (!history.id || !history.messages || !history.title) {
      throw new Error("Invalid history format")
    }

    // Generate new ID to avoid conflicts
    history.id = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    history.createdAt = Date.now()
    history.updatedAt = Date.now()

    this.histories.set(history.id, history)
    await this.saveHistory(history)

    return history
  }

  private async saveHistory(history: ChatHistory): Promise<void> {
    const filePath = path.join(this.historyDir, `${history.id}.json`)

    try {
      fs.writeFileSync(filePath, JSON.stringify(history, null, 2))
    } catch (error) {
      console.error("Failed to save history:", error)
      throw error
    }
  }

  async clearAllHistories(): Promise<void> {
    this.histories.clear()

    if (fs.existsSync(this.historyDir)) {
      const files = fs.readdirSync(this.historyDir)
      for (const file of files) {
        fs.unlinkSync(path.join(this.historyDir, file))
      }
    }
  }
}
