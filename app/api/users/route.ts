import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/sqlite"

export async function GET() {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT id, name, email, role, lastLogin, status 
      FROM users 
      ORDER BY createdAt DESC
    `)
    const users = stmt.all()
    return NextResponse.json(users)
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const db = getDatabase()
    const body = await request.json()
    const { name, email, role } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const stmt = db.prepare(`
      INSERT INTO users (name, email, role, status, lastLogin)
      VALUES (?, ?, ?, 'active', ?)
    `)

    const result = stmt.run(name, email, role || "developer", new Date().toISOString())

    return NextResponse.json({
      id: result.lastInsertRowid,
      name,
      email,
      role: role || "developer",
      status: "active",
      lastLogin: new Date().toLocaleString(),
    })
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
