export interface PerformanceMetric {
  timestamp: number
  value: number
  label: string
}

export interface AlertRule {
  id: string
  name: string
  metric: string
  threshold: number
  operator: ">" | "<" | "==" | "!="
  enabled: boolean
  actions: string[]
}

export class MonitoringService {
  private static instance: MonitoringService
  private performanceHistory: Map<string, PerformanceMetric[]> = new Map()
  private alertRules: Map<string, AlertRule> = new Map()
  private maxHistorySize = 1000

  private constructor() {}

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
    }
    return MonitoringService.instance
  }

  recordMetric(metric: string, value: number, label = ""): void {
    if (!this.performanceHistory.has(metric)) {
      this.performanceHistory.set(metric, [])
    }

    const history = this.performanceHistory.get(metric)!
    history.push({
      timestamp: Date.now(),
      value,
      label,
    })

    // Keep only recent history
    if (history.length > this.maxHistorySize) {
      history.shift()
    }

    // Check alert rules
    this.checkAlertRules(metric, value)
  }

  private checkAlertRules(metric: string, value: number): void {
    for (const [, rule] of this.alertRules) {
      if (!rule.enabled || rule.metric !== metric) continue

      let triggered = false
      switch (rule.operator) {
        case ">":
          triggered = value > rule.threshold
          break
        case "<":
          triggered = value < rule.threshold
          break
        case "==":
          triggered = value === rule.threshold
          break
        case "!=":
          triggered = value !== rule.threshold
          break
      }

      if (triggered) {
        this.executeAlertActions(rule)
      }
    }
  }

  private executeAlertActions(rule: AlertRule): void {
    for (const action of rule.actions) {
      // In a real implementation, execute the action
      console.log(`[v0] Alert triggered: ${rule.name} - Action: ${action}`)
    }
  }

  getMetricHistory(metric: string, limit = 100): PerformanceMetric[] {
    const history = this.performanceHistory.get(metric) || []
    return history.slice(-limit)
  }

  getLatestMetric(metric: string): PerformanceMetric | undefined {
    const history = this.performanceHistory.get(metric)
    return history && history.length > 0 ? history[history.length - 1] : undefined
  }

  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule)
  }

  removeAlertRule(id: string): void {
    this.alertRules.delete(id)
  }

  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values())
  }

  getActiveAlerts(): AlertRule[] {
    return Array.from(this.alertRules.values()).filter((rule) => rule.enabled)
  }
}
