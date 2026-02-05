"use client"

import { useEffect, useState } from "react"

interface DashboardMetrics {
  serverStatus: "online" | "offline" | "degraded"
  systemLoad: number
  activeConnections: number
  requestRate: number
  responseTime: number
  errorRate: number
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/admin/metrics")
        if (!response.ok) throw new Error("Failed to fetch metrics")
        const data = await response.json()
        setMetrics(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 2000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="admin-section">
        <h2 className="admin-section-title">Dashboard</h2>
        <p>Loading metrics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-section">
        <h2 className="admin-section-title">Dashboard</h2>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="admin-section">
        <h2 className="admin-section-title">Dashboard</h2>
        <p>No metrics available</p>
      </div>
    )
  }

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Dashboard</h2>

      <div className="feature-grid">
        <div className="feature-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>Server Status</p>
              <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", margin: "0" }}>
                {metrics.serverStatus === "online" ? "✓" : "✗"} {metrics.serverStatus}
              </p>
            </div>
            <span className="status-badge status-complete">{metrics.serverStatus}</span>
          </div>
        </div>

        <div className="feature-card">
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>System Load</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", margin: "0" }}>
            {metrics.systemLoad}%
          </p>
        </div>

        <div className="feature-card">
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>Active Connections</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", margin: "0" }}>
            {metrics.activeConnections}
          </p>
        </div>

        <div className="feature-card">
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>Request Rate</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", margin: "0" }}>
            {metrics.requestRate.toFixed(1)}/sec
          </p>
        </div>

        <div className="feature-card">
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>Response Time</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", margin: "0" }}>
            {metrics.responseTime}ms
          </p>
        </div>

        <div className="feature-card">
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>Error Rate</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", margin: "0" }}>
            {metrics.errorRate.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  )
}
