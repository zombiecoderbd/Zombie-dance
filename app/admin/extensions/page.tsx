"use client"

import { useEffect, useState } from "react"

interface Extension {
  id: number
  name: string
  status: "active" | "inactive"
}

export default function ExtensionsPage() {
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/extensions")
        if (!response.ok) throw new Error("Failed to fetch extensions")
        const data = await response.json()
        setExtensions(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setExtensions([])
      } finally {
        setLoading(false)
      }
    }

    fetchExtensions()
  }, [])

  const toggleExtension = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      const response = await fetch(`/api/extensions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update extension")

      setExtensions((prev) =>
        prev.map((ext) => (ext.id === id ? { ...ext, status: newStatus as "active" | "inactive" } : ext)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update extension")
    }
  }

  if (loading) {
    return (
      <div className="admin-section">
        <h2 className="admin-section-title">Extension Management</h2>
        <p>Loading extensions...</p>
      </div>
    )
  }

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Extension Management</h2>

      <p style={{ marginBottom: "20px", color: "#666" }}>Manage all installed extensions and their configurations</p>

      {error && (
        <div
          style={{
            marginBottom: "30px",
            padding: "15px",
            background: "#ffebee",
            borderRadius: "4px",
            borderLeft: "4px solid red",
            color: "red",
          }}
        >
          Error: {error}
        </div>
      )}

      {extensions.length === 0 ? (
        <p style={{ color: "#999", textAlign: "center", padding: "40px 0" }}>No extensions installed yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {extensions.map((ext) => (
              <tr key={ext.id}>
                <td style={{ fontWeight: "bold" }}>{ext.name}</td>
                <td>
                  <span className={`status-badge ${ext.status === "active" ? "status-complete" : "status-pending"}`}>
                    {ext.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toggleExtension(ext.id, ext.status)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "1px solid var(--secondary)",
                      background: ext.status === "active" ? "var(--secondary)" : "white",
                      color: ext.status === "active" ? "white" : "var(--secondary)",
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                  >
                    {ext.status === "active" ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
