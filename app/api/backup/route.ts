import { type NextRequest, NextResponse } from "next/server"
import { BackupManager } from "@/lib/backup/backupManager"

const backupManager = new BackupManager()

export async function POST(request: NextRequest) {
  try {
    const { action, params } = await request.json()

    switch (action) {
      case "createFull":
        const fullBackupPath = await backupManager.createFullBackup(params?.description)
        return NextResponse.json({ success: true, path: fullBackupPath })

      case "createIncremental":
        const incrementalPath = await backupManager.createIncrementalBackup(
          params?.lastBackupTime || Date.now() - 86400000,
        )
        return NextResponse.json({ success: true, path: incrementalPath })

      case "restore":
        await backupManager.restore(params.backupName)
        return NextResponse.json({ success: true, message: "Restore completed" })

      case "pointInTimeRestore":
        await backupManager.pointInTimeRestore(params.targetTime)
        return NextResponse.json({ success: true, message: "Point-in-time restore completed" })

      case "listBackups":
        const backups = backupManager.listBackups()
        return NextResponse.json({ backups })

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Backup API Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
