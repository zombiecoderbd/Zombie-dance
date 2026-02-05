import Database from "better-sqlite3"
import path from "path"
import { createSchema } from "./schema"

let dbInstance: Database.Database | null = null

export function initializeDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance
  }

  const dbDir = path.join(process.cwd(), "data")
  const dbPath = path.join(dbDir, "zombiecoder.db")

  // Ensure data directory exists
  const fs = require("fs")
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  dbInstance = new Database(dbPath)

  // Enable WAL mode for better concurrency
  dbInstance.pragma("journal_mode = WAL")
  dbInstance.pragma("foreign_keys = ON")
  dbInstance.pragma("synchronous = NORMAL")

  // Create schema
  createSchema(dbInstance)

  // Initialize default data if empty
  initializeDefaults(dbInstance)

  return dbInstance
}

function initializeDefaults(db: Database.Database): void {
  try {
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any
    if (userCount.count === 0) {
      const insertUser = db.prepare(`
        INSERT INTO users (name, email, role, status, lastLogin)
        VALUES (?, ?, ?, ?, ?)
      `)
      insertUser.run("System Admin", "admin@zombiecoder.local", "admin", "active", new Date().toISOString())
    }

    const modelCount = db.prepare("SELECT COUNT(*) as count FROM models").get() as any
    if (modelCount.count === 0) {
      const insertModel = db.prepare(`
        INSERT INTO models (name, provider, endpoint, isActive, isDefault)
        VALUES (?, ?, ?, ?, ?)
      `)
      // Ollama is the default
      insertModel.run("Ollama Default", "ollama", "http://localhost:11434", 1, 1)
    }
  } catch (error) {
    console.error("[v0] Error initializing defaults:", error)
  }
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    return initializeDatabase()
  }
  return dbInstance
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

export function queryDatabase<T>(sql: string, params?: any[]): T[] {
  const db = getDatabase()
  const stmt = db.prepare(sql)
  return (params ? stmt.all(...params) : stmt.all()) as T[]
}

export function queryDatabaseOne<T>(sql: string, params?: any[]): T | undefined {
  const db = getDatabase()
  const stmt = db.prepare(sql)
  return (params ? stmt.get(...params) : stmt.get()) as T | undefined
}

export function executeDatabase(sql: string, params?: any[]): Database.RunResult {
  const db = getDatabase()
  const stmt = db.prepare(sql)
  return params ? stmt.run(...params) : stmt.run()
}

export function executeDatabaseTransaction<T>(callback: (db: Database.Database) => T): T {
  const db = getDatabase()
  const transaction = db.transaction(callback)
  return transaction(db)
}
