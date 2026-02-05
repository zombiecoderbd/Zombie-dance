"use client"

import type React from "react"

import { useEffect, useState } from "react"

interface User {
  id: number
  name: string
  email: string
  role: "admin" | "developer" | "viewer"
  lastLogin: string
  status: "active" | "inactive"
}

interface UserForm {
  name: string
  email: string
  role: "admin" | "developer" | "viewer"
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<UserForm>({ name: "", email: "", role: "developer" })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/users")
        if (!response.ok) throw new Error("Failed to fetch users")
        const data = await response.json()
        setUsers(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const updateRole = async (userId: number, newRole: "admin" | "developer" | "viewer") => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) throw new Error("Failed to update user role")

      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user")
    }
  }

  const toggleStatus = async (userId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update user status")

      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, status: newStatus as "active" | "inactive" } : user)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user")
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!response.ok) throw new Error("Failed to add user")

      const newUser = await response.json()
      setUsers([...users, newUser])
      setForm({ name: "", email: "", role: "developer" })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add user")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-section">
        <h2 className="admin-section-title">User Management</h2>
        <p>Loading users...</p>
      </div>
    )
  }

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">User Management</h2>

      <p style={{ marginBottom: "20px", color: "#666" }}>Manage users, roles, and access permissions</p>

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

      {users.length === 0 ? (
        <p style={{ color: "#999", textAlign: "center", padding: "40px 0" }}>No users created yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last Login</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ fontWeight: "bold" }}>{user.name}</td>
                <td style={{ fontSize: "0.9rem" }}>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value as "admin" | "developer" | "viewer")}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontFamily: "inherit",
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="developer">Developer</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td style={{ fontSize: "0.9rem" }}>{user.lastLogin}</td>
                <td>
                  <span className={`status-badge ${user.status === "active" ? "status-complete" : "status-pending"}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toggleStatus(user.id, user.status)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      background: "white",
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                  >
                    {user.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: "30px" }}>
        <h3 style={{ color: "var(--primary)", marginBottom: "15px" }}>Add New User</h3>
        <form
          onSubmit={handleAddUser}
          style={{
            maxWidth: "600px",
            display: "grid",
            gap: "15px",
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Full Name</label>
            <input
              type="text"
              placeholder="Enter user name"
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
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Email</label>
            <input
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "developer" | "viewer" })}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontFamily: "inherit",
              }}
            >
              <option value="viewer">Viewer</option>
              <option value="developer">Developer</option>
              <option value="admin">Admin</option>
            </select>
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
            {submitting ? "Adding..." : "Add User"}
          </button>
        </form>
      </div>
    </div>
  )
}
