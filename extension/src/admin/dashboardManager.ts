import * as vscode from "vscode"
import { LLMProviderFactory } from "../llm/llmProvider"

export interface DashboardMetrics {
  serverStatus: "online" | "offline" | "degraded"
  systemLoad: number
  activeConnections: number
  requestsPerSecond: number
  avgResponseTime: number
  errorRate: number
  uptime: number
  providersHealthy: ProviderHealth[]
  recentActivity: ActivityLog[]
}

export interface ProviderHealth {
  name: string
  status: "healthy" | "unhealthy" | "unknown"
  responseTime: number
  lastChecked: number
  availableModels: string[]
}

export interface ActivityLog {
  timestamp: number
  type: string
  message: string
  severity: "info" | "warning" | "error"
}

export class DashboardManager {
  private static instance: DashboardManager
  private metrics: DashboardMetrics
  private activityLogs: ActivityLog[] = []
  private providerHealthChecks: Map<string, NodeJS.Timer> = new Map()
  private metricsUpdateInterval: NodeJS.Timer | null = null

  private constructor() {
    this.metrics = {
      serverStatus: "offline",
      systemLoad: 0,
      activeConnections: 0,
      requestsPerSecond: 0,
      avgResponseTime: 0,
      errorRate: 0,
      uptime: 0,
      providersHealthy: [],
      recentActivity: [],
    }
  }

  static getInstance(): DashboardManager {
    if (!DashboardManager.instance) {
      DashboardManager.instance = new DashboardManager()
    }
    return DashboardManager.instance
  }

  async initialize(): Promise<void> {
    // Start monitoring providers
    await this.startProviderHealthChecks()

    // Start collecting metrics
    this.metricsUpdateInterval = setInterval(() => {
      this.updateMetrics()
    }, 5000) // Update every 5 seconds
  }

  private async startProviderHealthChecks(): Promise<void> {
    const providers = ["ollama", "openai", "anthropic"]

    for (const provider of providers) {
      const interval = setInterval(async () => {
        await this.checkProviderHealth(provider)
      }, 30000) // Check every 30 seconds

      this.providerHealthChecks.set(provider, interval)
      await this.checkProviderHealth(provider) // Initial check
    }
  }

  private async checkProviderHealth(providerName: string): Promise<void> {
    try {
      let config: any = {}

      if (providerName === "ollama") {
        config = { baseUrl: "http://localhost:11434", model: "llama2" }
      } else if (providerName === "openai") {
        const apiKey = await vscode.commands.executeCommand("zombie.getSecretValue", "openai_key")
        if (!apiKey) return
        config = { apiKey, model: "gpt-4" }
      } else if (providerName === "anthropic") {
        const apiKey = await vscode.commands.executeCommand("zombie.getSecretValue", "anthropic_key")
        if (!apiKey) return
        config = { apiKey, model: "claude-3-opus-20240229" }
      }

      const provider = LLMProviderFactory.createProvider(providerName as "ollama" | "openai" | "anthropic", config)
      const startTime = Date.now()
      const isHealthy = await provider.validateConnection()
      const responseTime = Date.now() - startTime
      const availableModels = await provider.listModels()

      const health: ProviderHealth = {
        name: providerName,
        status: isHealthy ? "healthy" : "unhealthy",
        responseTime,
        lastChecked: Date.now(),
        availableModels,
      }

      // Update or add provider health
      const existingIndex = this.metrics.providersHealthy.findIndex((p) => p.name === providerName)
      if (existingIndex >= 0) {
        this.metrics.providersHealthy[existingIndex] = health
      } else {
        this.metrics.providersHealthy.push(health)
      }

      this.addActivityLog({
        timestamp: Date.now(),
        type: "provider-health-check",
        message: `${providerName} provider check: ${isHealthy ? "healthy" : "unhealthy"}`,
        severity: isHealthy ? "info" : "warning",
      })
    } catch (error) {
      this.addActivityLog({
        timestamp: Date.now(),
        type: "provider-error",
        message: `Error checking ${providerName} health: ${error}`,
        severity: "error",
      })
    }
  }

  private updateMetrics(): void {
    // Update system load
    const systemLoad = Math.random() * 100 // In production, use actual system metrics
    this.metrics.systemLoad = Math.round(systemLoad)

    // Simulate active connections
    this.metrics.activeConnections = Math.floor(Math.random() * 50)

    // Simulate requests per second
    this.metrics.requestsPerSecond = Math.floor(Math.random() * 100)

    // Simulate response time (in ms)
    this.metrics.avgResponseTime = Math.floor(Math.random() * 500) + 50

    // Simulate error rate
    this.metrics.errorRate = Math.random() * 5

    // Update server status based on providers
    const healthyProviders = this.metrics.providersHealthy.filter((p) => p.status === "healthy")
    if (healthyProviders.length > 0) {
      this.metrics.serverStatus = "online"
    } else {
      this.metrics.serverStatus = "offline"
    }

    // Update uptime
    this.metrics.uptime += 5 // Increment by 5 seconds
  }

  private addActivityLog(log: ActivityLog): void {
    this.activityLogs.push(log)
    this.metrics.recentActivity = this.activityLogs.slice(-20) // Keep last 20 logs
  }

  getMetrics(): DashboardMetrics {
    return { ...this.metrics }
  }

  getActivityLogs(limit = 50): ActivityLog[] {
    return this.activityLogs.slice(-limit)
  }

  async cleanup(): Promise<void> {
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval)
    }

    for (const [, interval] of this.providerHealthChecks) {
      clearInterval(interval)
    }
    this.providerHealthChecks.clear()
  }
}
