import * as vscode from "vscode"

export interface ExtensionInfo {
  id: string
  name: string
  version: string
  description: string
  author: string
  isActive: boolean
  isEnabled: boolean
  health: "healthy" | "unhealthy" | "unknown"
  lastError?: string
  permissions: string[]
  settings: Record<string, any>
}

export class ExtensionManager {
  private static instance: ExtensionManager
  private extensions: Map<string, ExtensionInfo> = new Map()

  private constructor() {}

  static getInstance(): ExtensionManager {
    if (!ExtensionManager.instance) {
      ExtensionManager.instance = new ExtensionManager()
    }
    return ExtensionManager.instance
  }

  async initialize(): Promise<void> {
    await this.loadInstalledExtensions()
  }

  private async loadInstalledExtensions(): Promise<void> {
    // In a real implementation, this would read from VS Code's extension list
    // For now, we'll add a mock Zombie extension as the main one
    const zombieExt: ExtensionInfo = {
      id: "zombie-ai-assistant",
      name: "Zombie AI Assistant",
      version: "2.0.0",
      description: "AI-powered coding assistant with RAG and local model support",
      author: "ZombieCoder Team",
      isActive: true,
      isEnabled: true,
      health: "healthy",
      permissions: ["workspace", "terminal", "editor", "settings"],
      settings: {
        defaultModel: "ollama",
        endpoint: "http://localhost:8001",
        ragEnabled: true,
        safetyAgreement: true,
      },
    }

    this.extensions.set(zombieExt.id, zombieExt)
  }

  getExtensions(): ExtensionInfo[] {
    return Array.from(this.extensions.values())
  }

  getExtension(id: string): ExtensionInfo | undefined {
    return this.extensions.get(id)
  }

  async updateExtensionSetting(id: string, setting: string, value: any): Promise<void> {
    const ext = this.extensions.get(id)
    if (!ext) throw new Error(`Extension ${id} not found`)

    ext.settings[setting] = value

    // Update VS Code settings
    const config = vscode.workspace.getConfiguration(`extension.${id}`)
    await config.update(setting, value, vscode.ConfigurationTarget.Global)
  }

  async toggleExtension(id: string, enabled: boolean): Promise<void> {
    const ext = this.extensions.get(id)
    if (!ext) throw new Error(`Extension ${id} not found`)

    ext.isEnabled = enabled
    // In a real implementation, this would actually enable/disable the extension
  }

  async reinstallExtension(id: string): Promise<void> {
    const ext = this.extensions.get(id)
    if (!ext) throw new Error(`Extension ${id} not found`)

    try {
      // In a real implementation, this would trigger a reinstall
      ext.health = "healthy"
      ext.lastError = undefined
    } catch (error) {
      ext.health = "unhealthy"
      ext.lastError = String(error)
      throw error
    }
  }
}
