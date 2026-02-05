import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/sqlite"

export async function GET() {
  try {
    const db = getDatabase()

    const stmt = db.prepare(`
      SELECT id, name, provider, isActive, isDefault 
      FROM models 
      WHERE isActive = 1
      ORDER BY isDefault DESC, name ASC
    `)

    const models = stmt.all()

    return NextResponse.json(models)
  } catch (error) {
    console.error("[v0] Error fetching models:", error)
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const db = getDatabase()
    const body = await request.json()

    const { name, provider, endpoint, apiKey, isDefault } = body

    if (!name || !provider) {
      return NextResponse.json({ error: "Name and provider are required" }, { status: 400 })
    }

    if (isDefault) {
      const resetStmt = db.prepare("UPDATE models SET isDefault = 0 WHERE isDefault = 1")
      resetStmt.run()
    }

    const stmt = db.prepare(`
      INSERT INTO models (name, provider, endpoint, apiKey, isDefault)
      VALUES (?, ?, ?, ?, ?)
    `)

    const result = stmt.run(name, provider, endpoint || null, apiKey || null, isDefault ? 1 : 0)

    return NextResponse.json({ id: result.lastInsertRowid, name, provider })
  } catch (error) {
    console.error("[v0] Error creating model:", error)
    return NextResponse.json({ error: "Failed to create model" }, { status: 500 })
  }
}
