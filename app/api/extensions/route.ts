import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/sqlite"

export async function GET() {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT id, name, status 
      FROM extensions 
      ORDER BY name ASC
    `)
    const extensions = stmt.all()
    return NextResponse.json(extensions)
  } catch (error) {
    console.error("[v0] Error fetching extensions:", error)
    return NextResponse.json({ error: "Failed to fetch extensions" }, { status: 500 })
  }
}
