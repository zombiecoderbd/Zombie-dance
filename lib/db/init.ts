import Database from "better-sqlite3"
import path from "path"

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), "data", "zombiecoder.db")
    db = new Database(dbPath)
    db.pragma("journal_mode = WAL")
    initializeSchema()
  }
  return db
}

function initializeSchema() {
  const database = db!

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'developer',
      status TEXT DEFAULT 'active',
      lastLogin DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS extensions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'inactive',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Models table - backend-controlled list
  database.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      provider TEXT NOT NULL,
      endpoint TEXT,
      apiKey TEXT,
      isActive BOOLEAN DEFAULT 1,
      isDefault BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // System metrics table
  database.exec(`
    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      serverStatus TEXT DEFAULT 'online',
      systemLoad REAL DEFAULT 0,
      activeConnections INTEGER DEFAULT 0,
      requestRate REAL DEFAULT 0,
      responseTime INTEGER DEFAULT 0,
      errorRate REAL DEFAULT 0
    )
  `)

  // Configuration table
  database.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Activity log table
  database.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      action TEXT NOT NULL,
      details TEXT,
      status TEXT DEFAULT 'pending'
    )
  `)
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
