import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { BackupManager } from "@/lib/backup/backupManager"
import * as fs from "fs"
import * as path from "path"

describe("Backup and Recovery", () => {
  let backupManager: BackupManager
  const testDataDir = "./test-data"
  const testBackupDir = "./test-backups"

  beforeEach(() => {
    if (!fs.existsSync(testDataDir)) fs.mkdirSync(testDataDir)
    fs.writeFileSync(path.join(testDataDir, "test.txt"), "test content")
    backupManager = new BackupManager(testBackupDir, testDataDir)
  })

  afterEach(() => {
    if (fs.existsSync(testDataDir)) fs.rmSync(testDataDir, { recursive: true })
    if (fs.existsSync(testBackupDir)) fs.rmSync(testBackupDir, { recursive: true })
  })

  it("should create full backup", async () => {
    const backupPath = await backupManager.createFullBackup("test backup")
    expect(fs.existsSync(backupPath)).toBe(true)
  })

  it("should list backups", async () => {
    await backupManager.createFullBackup()
    const backups = backupManager.listBackups()
    expect(backups.length).toBeGreaterThan(0)
  })

  it("should create incremental backup", async () => {
    const time = Date.now() - 1000000
    const path = await backupManager.createIncrementalBackup(time)
    expect(fs.existsSync(path)).toBe(true)
  })
})
