import type Database from "better-sqlite3"

export interface DatabaseSchema {
  users: User
  extensions: Extension
  models: Model
  metrics: Metric
  config: Config
  activity_log: ActivityLog
}

export interface User {
  id: number
  name: string
  email: string
  role: "admin" | "developer" | "viewer"
  status: "active" | "inactive"
  lastLogin: string | null
  createdAt: string
  updatedAt: string
}

export interface Extension {
  id: number
  name: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

export interface Model {
  id: number
  name: string
  provider: string
  endpoint: string | null
  apiKey: string | null
  isActive: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface Metric {
  id: number
  timestamp: string
  serverStatus: "online" | "offline" | "degraded"
  systemLoad: number
  activeConnections: number
  requestRate: number
  responseTime: number
  errorRate: number
}

export interface Config {
  key: string
  value: string
  updatedAt: string
}

export interface ActivityLog {
  id: number
  timestamp: string
  action: string
  details: string | null
  status: string
}

export function createSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'developer' CHECK(role IN ('admin', 'developer', 'viewer')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      lastLogin TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS extensions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'inactive' CHECK(status IN ('active', 'inactive')),
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      provider TEXT NOT NULL,
      endpoint TEXT,
      apiKey TEXT,
      isActive BOOLEAN DEFAULT 1,
      isDefault BOOLEAN DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      serverStatus TEXT DEFAULT 'online' CHECK(serverStatus IN ('online', 'offline', 'degraded')),
      systemLoad REAL DEFAULT 0,
      activeConnections INTEGER DEFAULT 0,
      requestRate REAL DEFAULT 0,
      responseTime INTEGER DEFAULT 0,
      errorRate REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      action TEXT NOT NULL,
      details TEXT,
      status TEXT DEFAULT 'pending'
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_models_default ON models(isDefault) WHERE isActive = 1;
    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp DESC);
  `)
}
