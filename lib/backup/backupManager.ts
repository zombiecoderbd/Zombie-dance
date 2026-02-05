import * as fs from "fs"
import * as path from "path"
import { createWriteStream, createReadStream } from "fs"
import { pipeline } from "stream/promises"
import { createGzip, createGunzip } from "zlib"

interface BackupMetadata {
  timestamp: number
  type: "full" | "incremental"
  version: string
  sourceSize: number
  compressedSize: number
  checksum: string
  files: Array<{
    path: string
    hash: string
    modified: number
  }>
}

export class BackupManager {
  private backupDir: string
  private dataDir: string

  constructor(backupDir = "./backups", dataDir = "./data") {
    this.backupDir = backupDir
    this.dataDir = dataDir
    this.ensureDirectories()
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  async createFullBackup(description?: string): Promise<string> {
    const timestamp = Date.now()
    const backupName = `backup-full-${timestamp}.tar.gz`
    const backupPath = path.join(this.backupDir, backupName)

    try {
      const files = this.collectFiles(this.dataDir)
      const metadata: BackupMetadata = {
        timestamp,
        type: "full",
        version: "1.0.0",
        sourceSize: this.calculateSize(files),
        compressedSize: 0,
        checksum: "",
        files: files.map((f) => ({
          path: f,
          hash: this.calculateHash(f),
          modified: fs.statSync(f).mtimeMs,
        })),
      }

      // Create gzip stream for compression
      const gzip = createGzip()
      const writeStream = createWriteStream(backupPath)

      await pipeline(createReadStream(this.dataDir), gzip, writeStream)

      metadata.compressedSize = fs.statSync(backupPath).size
      this.saveMetadata(backupName, metadata)

      console.log(`[v0] Full backup created: ${backupName}`)
      return backupPath
    } catch (error) {
      console.error("[v0] Backup creation failed:", error)
      throw error
    }
  }

  async createIncrementalBackup(lastBackupTime: number): Promise<string> {
    const timestamp = Date.now()
    const backupName = `backup-incremental-${timestamp}.tar.gz`
    const backupPath = path.join(this.backupDir, backupName)

    try {
      const files = this.collectFiles(this.dataDir).filter((f) => fs.statSync(f).mtimeMs > lastBackupTime)

      const metadata: BackupMetadata = {
        timestamp,
        type: "incremental",
        version: "1.0.0",
        sourceSize: this.calculateSize(files),
        compressedSize: 0,
        checksum: "",
        files: files.map((f) => ({
          path: f,
          hash: this.calculateHash(f),
          modified: fs.statSync(f).mtimeMs,
        })),
      }

      const gzip = createGzip()
      const writeStream = createWriteStream(backupPath)

      await pipeline(createReadStream(this.dataDir), gzip, writeStream)

      metadata.compressedSize = fs.statSync(backupPath).size
      this.saveMetadata(backupName, metadata)

      console.log(`[v0] Incremental backup created: ${backupName}`)
      return backupPath
    } catch (error) {
      console.error("[v0] Incremental backup failed:", error)
      throw error
    }
  }

  async restore(backupName: string, restoreDir: string = this.dataDir): Promise<void> {
    const backupPath = path.join(this.backupDir, backupName)

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupName}`)
    }

    try {
      const gunzip = createGunzip()
      const readStream = createReadStream(backupPath)
      const writeStream = createWriteStream(restoreDir)

      await pipeline(readStream, gunzip, writeStream)

      console.log(`[v0] Restore completed from: ${backupName}`)
    } catch (error) {
      console.error("[v0] Restore failed:", error)
      throw error
    }
  }

  async pointInTimeRestore(targetTime: number, restoreDir: string = this.dataDir): Promise<void> {
    const backups = this.listBackups()
    const candidateBackup = backups.find((b) => b.timestamp <= targetTime)

    if (!candidateBackup) {
      throw new Error("No backup available for the specified time")
    }

    await this.restore(candidateBackup.name, restoreDir)
    console.log(`[v0] Point-in-time restore completed to: ${new Date(targetTime).toISOString()}`)
  }

  listBackups(): Array<{ name: string; timestamp: number; type: string; size: number }> {
    const backups = fs.readdirSync(this.backupDir).filter((f) => f.startsWith("backup-") && f.endsWith(".tar.gz"))

    return backups.map((name) => {
      const backupPath = path.join(this.backupDir, name)
      const metadata = this.loadMetadata(name)
      return {
        name,
        timestamp: metadata?.timestamp || 0,
        type: metadata?.type || "unknown",
        size: fs.statSync(backupPath).size,
      }
    })
  }

  private collectFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir)

    files.forEach((file) => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory() && !file.startsWith(".")) {
        this.collectFiles(filePath, fileList)
      } else if (!file.startsWith(".")) {
        fileList.push(filePath)
      }
    })

    return fileList
  }

  private calculateSize(files: string[]): number {
    return files.reduce((total, file) => total + fs.statSync(file).size, 0)
  }

  private calculateHash(filePath: string): string {
    const crypto = require("crypto")
    const content = fs.readFileSync(filePath)
    return crypto.createHash("sha256").update(content).digest("hex")
  }

  private saveMetadata(backupName: string, metadata: BackupMetadata): void {
    const metadataPath = path.join(this.backupDir, `${backupName}.json`)
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
  }

  private loadMetadata(backupName: string): BackupMetadata | null {
    const metadataPath = path.join(this.backupDir, `${backupName}.json`)
    if (fs.existsSync(metadataPath)) {
      return JSON.parse(fs.readFileSync(metadataPath, "utf-8"))
    }
    return null
  }
}
