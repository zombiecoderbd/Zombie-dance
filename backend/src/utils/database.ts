import Database from "better-sqlite3";
import { logger } from "./logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QueryResult {
    [key: string]: any;
}

interface RunResult {
    changes: number;
    lastID: number;
}

export class DatabaseManager {
    private db: Database.Database | null = null;
    private dbPath: string;

    constructor() {
        this.dbPath =
            process.env.DATABASE_URL?.replace("sqlite:", "") ||
            path.join(__dirname, "../../../zombi.db");
        logger.info(`Database path: ${this.dbPath}`);
    }

    connect(): void {
        if (this.db) return;

        try {
            this.db = new Database(this.dbPath);

            // Configure SQLite for better performance
            this.db.pragma("journal_mode = WAL");
            this.db.pragma("synchronous = NORMAL");
            this.db.pragma("foreign_keys = ON");
            this.db.pragma("cache_size = 10000");

            logger.info(`Connected to SQLite database: ${this.dbPath}`);
        } catch (error) {
            logger.error("Database connection failed:", error);
            throw error;
        }
    }

    query(sql: string, params: any[] = []): QueryResult[] {
        if (!this.db) this.connect();

        try {
            const stmt = this.db!.prepare(sql);
            return stmt.all(params) as QueryResult[];
        } catch (error) {
            logger.error("Database query error:", {
                error: error instanceof Error ? error.message : "Unknown error",
                sql: sql.substring(0, 100),
                params,
            });
            throw error;
        }
    }

    run(sql: string, params: any[] = []): RunResult {
        if (!this.db) this.connect();

        try {
            const stmt = this.db!.prepare(sql);
            const result = stmt.run(params);
            return {
                changes: result.changes,
                lastID: result.lastInsertRowid as number,
            };
        } catch (error) {
            logger.error("Database run error:", {
                error: error instanceof Error ? error.message : "Unknown error",
                sql: sql.substring(0, 100),
                params,
            });
            throw error;
        }
    }

    get(sql: string, params: any[] = []): QueryResult | undefined {
        if (!this.db) this.connect();

        try {
            const stmt = this.db!.prepare(sql);
            return stmt.get(params) as QueryResult | undefined;
        } catch (error) {
            logger.error("Database get error:", {
                error: error instanceof Error ? error.message : "Unknown error",
                sql: sql.substring(0, 100),
                params,
            });
            throw error;
        }
    }

    close(): void {
        if (this.db) {
            try {
                this.db.close();
                this.db = null;
                logger.info("Database connection closed");
            } catch (error) {
                logger.error("Database close error:", error);
            }
        }
    }

    // Transaction support
    transaction<T>(callback: () => T): T {
        if (!this.db) this.connect();

        const transaction = this.db!.transaction(callback);
        return transaction();
    }

    // Health check
    healthCheck(): { status: string; latency: number } {
        const start = Date.now();

        try {
            if (!this.db) this.connect();
            this.query("SELECT 1 as test");

            return {
                status: "healthy",
                latency: Date.now() - start,
            };
        } catch (error) {
            logger.error("Database health check failed:", error);
            return {
                status: "unhealthy",
                latency: Date.now() - start,
            };
        }
    }

    // Get all available models from database
    getAvailableModels(): QueryResult[] {
        try {
            return this.query(`
                SELECT id, name, display_name, provider, model_id, is_active, is_default,
                       max_tokens, temperature, top_p, endpoint_url
                FROM model_configs
                WHERE is_active = 1
                ORDER BY is_default DESC, display_name ASC
            `);
        } catch (error) {
            logger.warn("Failed to get models from database:", error);
            return [];
        }
    }

    // Get user by username
    getUserByUsername(username: string): QueryResult | undefined {
        try {
            return this.get("SELECT * FROM users WHERE username = ?", [username]);
        } catch (error) {
            logger.error("Failed to get user:", error);
            return undefined;
        }
    }

    // Log activity
    logActivity(userId: number, action: string, resourceType: string, details: any): void {
        try {
            this.run(
                `
                INSERT INTO activity_log (user_id, action, resource_type, details, status)
                VALUES (?, ?, ?, ?, 'success')
            `,
                [userId, action, resourceType, JSON.stringify(details)],
            );
        } catch (error) {
            logger.warn("Failed to log activity:", error);
        }
    }

    // Get system metrics
    getSystemMetrics(): QueryResult[] {
        try {
            return this.query(`
                SELECT
                    'active_users' as metric,
                    COUNT(*) as value,
                    'count' as unit,
                    datetime('now') as timestamp
                FROM users
                WHERE is_active = 1
                UNION ALL
                SELECT
                    'total_sessions' as metric,
                    COUNT(*) as value,
                    'count' as unit,
                    datetime('now') as timestamp
                FROM chat_sessions
                WHERE created_at > datetime('now', '-24 hours')
                UNION ALL
                SELECT
                    'active_models' as metric,
                    COUNT(*) as value,
                    'count' as unit,
                    datetime('now') as timestamp
                FROM model_configs
                WHERE is_active = 1
            `);
        } catch (error) {
            logger.warn("Failed to get system metrics:", error);
            return [];
        }
    }
}

// Export singleton instance
export const db = new DatabaseManager();
