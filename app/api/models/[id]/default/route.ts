import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/sqlite"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDatabase()
    const modelId = Number.parseInt(params.id)

    const resetStmt = db.prepare("UPDATE models SET isDefault = 0 WHERE isDefault = 1")
    resetStmt.run()

    const setStmt = db.prepare("UPDATE models SET isDefault = 1 WHERE id = ?")
    setStmt.run(modelId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error setting default model:", error)
    return NextResponse.json({ error: "Failed to set default model" }, { status: 500 })
  }
}
