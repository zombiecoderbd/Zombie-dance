"use client"

import { useEffect, useState } from "react"

interface MonitoringData {
  timestamp: string
  serverStatus: "online" | "offline" | "degraded"
  cpuUsage: number
  memoryUsage: number
  activeRequests: number
  responseTime: number
  errorCount: number
  totalRequests: number
  providers: Array<{
    name: string
    status: "healthy" | "unavailable" | "degraded"
    responseTime: number | null
    errorRate: number | null
    lastCheck: string
  }>
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        const response = await fetch("/api/admin/monitoring")
        if (!response.ok) throw new Error("Failed to fetch monitoring data")
        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchMonitoringData()
    const interval = setInterval(fetchMonitoringData, 3000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="admin-section">
        <h2 className="admin-section-title">System Monitoring</h2>
        <p>Loading monitoring data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-section">
        <h2 className="admin-section-title">System Monitoring</h2>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="admin-section">
        <h2 className="admin-section-title">System Monitoring</h2>
        <p>No monitoring data available</p>
      </div>
    )
  }

  const errorRate = data.totalRequests > 0 ? ((data.errorCount / data.totalRequests) * 100).toFixed(2) : 0

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">System Monitoring</h2>

      <div style={{ marginBottom: "30px", padding: "15px", background: "#f0f0f0", borderRadius: "4px" }}>
        <strong>Last Updated:</strong> {data.timestamp}
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>Server Status</p>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)" }}>
            {data.serverStatus === "online" ? "🟢" : data.serverStatus === "degraded" ? "🟡" : "🔴"}{" "}
            {data.serverStatus.toUpperCase()}
          </div>
        </div>

        <div className="feature-card">
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>CPU Usage</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", margin: "0" }}>{data.cpuUsage}%</p>
          <div
            style={{
              marginTop: "10px",
              height: "8px",
              background: "#eee",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${data.cpuUsage}%`,
                background: data.cpuUsage > 80 ? "var(--danger)" : "var(--success)",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>

        <div className="feature-card">
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>Memory Usage</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", margin: "0" }}>
            {data.memoryUsage}%
          </p>
          <div
            style={{
              marginTop: "10px",
              height: "8px",
              background: "#eee",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${data.memoryUsage}%`,
                background: data.memoryUsage > 80 ? "var(--danger)" : "var(--success)",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>

        <div className="feature-card">
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>Active Requests</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", margin: "0" }}>
            {data.activeRequests}
          </p>
        </div>

        <div className="feature-card">
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>Avg Response Time</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", margin: "0" }}>
            {data.responseTime}ms
          </p>
        </div>

        <div className="feature-card">
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>Error Rate</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", margin: "0" }}>{errorRate}%</p>
        </div>
      </div>

      <h3 style={{ marginTop: "30px", color: "var(--primary)", marginBottom: "15px" }}>Provider Health Status</h3>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Status</th>
            <th>Response Time</th>
            <th>Error Rate</th>
            <th>Last Check</th>
          </tr>
        </thead>
        <tbody>
          {data.providers.length > 0 ? (
            data.providers.map((provider) => (
              <tr key={provider.name}>
                <td>{provider.name}</td>
                <td>
                  <span
                    className={`status-badge ${
                      provider.status === "healthy"
                        ? "status-complete"
                        : provider.status === "degraded"
                          ? "status-pending"
                          : "status-pending"
                    }`}
                  >
                    {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                  </span>
                </td>
                <td>{provider.responseTime ? `${provider.responseTime}ms` : "-"}</td>
                <td>{provider.errorRate !== null ? `${provider.errorRate.toFixed(2)}%` : "-"}</td>
                <td>{provider.lastCheck}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", color: "#999" }}>
                No providers configured yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
