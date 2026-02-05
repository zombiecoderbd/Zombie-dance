"use client"

import type React from "react"

import { useEffect, useState } from "react"

interface Model {
  id: number
  name: string
  provider: string
  isActive: boolean
  isDefault: boolean
}

interface ProviderForm {
  name: string
  endpoint: string
  apiKey: string
}

export default function ProvidersPage() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ProviderForm>({ name: "", endpoint: "", apiKey: "" })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/models")
        if (!response.ok) throw new Error("Failed to fetch models")
        const data = await response.json()
        setModels(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setModels([])
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [])

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          provider: form.name.toLowerCase(),
          endpoint: form.endpoint,
          apiKey: form.apiKey,
        }),
      })

      if (!response.ok) throw new Error("Failed to add provider")

      const newModel = await response.json()
      setModels([...models, newModel])
      setForm({ name: "", endpoint: "", apiKey: "" })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add provider")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSetDefault = async (modelId: number) => {
    try {
      const response = await fetch(`/api/models/${modelId}/default`, {
        method: "PUT",
      })

      if (!response.ok) throw new Error("Failed to set default")

      setModels(
        models.map((m) => ({
          ...m,
          isDefault: m.id === modelId,
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default")
    }
  }

  if (loading) {
    return (
      <div className="admin-section">
        <h2 className="admin-section-title">Provider Settings</h2>
        <p>Loading providers...</p>
      </div>
    )
  }

  const defaultModel = models.find((m) => m.isDefault)

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Provider Settings</h2>

      <p style={{ marginBottom: "20px", color: "#666" }}>Manage AI provider connections and configure API endpoints</p>

      {defaultModel && (
        <div
          style={{
            marginBottom: "30px",
            padding: "15px",
            background: "#e3f2fd",
            borderRadius: "4px",
            borderLeft: "4px solid var(--secondary)",
          }}
        >
          <strong>Default Provider:</strong> {defaultModel.name} ({defaultModel.provider})
        </div>
      )}

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

      {models.length > 0 && (
        <>
          <h3 style={{ color: "var(--primary)", marginBottom: "15px" }}>Added Providers</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Provider Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id}>
                  <td style={{ fontWeight: "bold" }}>
                    {model.name}
                    {model.isDefault && (
                      <span className="status-badge status-complete" style={{ marginLeft: "10px" }}>
                        Default
                      </span>
                    )}
                  </td>
                  <td>{model.provider}</td>
                  <td>
                    <span className={`status-badge ${model.isActive ? "status-complete" : "status-pending"}`}>
                      {model.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleSetDefault(model.id)}
                      disabled={model.isDefault}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        border: "1px solid var(--secondary)",
                        background: model.isDefault ? "#ddd" : "var(--secondary)",
                        color: model.isDefault ? "#999" : "white",
                        cursor: model.isDefault ? "not-allowed" : "pointer",
                        transition: "all 0.3s",
                      }}
                    >
                      {model.isDefault ? "Default" : "Set Default"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={{ marginTop: "30px" }}>
        <h3 style={{ color: "var(--primary)", marginBottom: "15px" }}>Add New Provider</h3>
        <form
          onSubmit={handleAddProvider}
          style={{
            maxWidth: "600px",
            display: "grid",
            gap: "15px",
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Provider Name</label>
            <input
              type="text"
              placeholder="e.g., My Ollama"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontFamily: "inherit",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>API Endpoint</label>
            <input
              type="url"
              placeholder="https://api.example.com or http://localhost:11434"
              value={form.endpoint}
              onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontFamily: "inherit",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>API Key (optional)</label>
            <input
              type="password"
              placeholder="Enter your API key if required"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontFamily: "inherit",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 20px",
              background: submitting ? "#ccc" : "var(--success)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "all 0.3s",
              alignSelf: "start",
            }}
          >
            {submitting ? "Adding..." : "Add Provider"}
          </button>
        </form>
      </div>
    </div>
  )
}
