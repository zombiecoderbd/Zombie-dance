import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/sqlite"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDatabase()
    const extId = Number.parseInt(params.id)
    const body = await request.json()
    const { status } = body

    const stmt = db.prepare("UPDATE extensions SET status = ? WHERE id = ?")
    stmt.run(status, extId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating extension:", error)
    return NextResponse.json({ error: "Failed to update extension" }, { status: 500 })
  }
}
