import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/sqlite"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDatabase()
    const userId = Number.parseInt(params.id)
    const body = await request.json()
    const { role, status } = body

    if (role) {
      const stmt = db.prepare("UPDATE users SET role = ? WHERE id = ?")
      stmt.run(role, userId)
    }

    if (status) {
      const stmt = db.prepare("UPDATE users SET status = ? WHERE id = ?")
      stmt.run(status, userId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
