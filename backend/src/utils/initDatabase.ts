import { DatabaseManager } from "./database.js";
import { logger } from "./logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OllamaModel {
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details?: {
        parent_model?: string;
        format?: string;
        family?: string;
        families?: string[];
        parameter_size?: string;
        quantization_level?: string;
    };
}

interface OllamaListResponse {
    models: OllamaModel[];
}

export class DatabaseInitializer {
    private db: DatabaseManager;
    private ollamaHost: string;

    constructor() {
        this.db = new DatabaseManager();
        this.ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
    }

    /**
     * Initialize database with schema
     */
    async initializeSchema(): Promise<void> {
        logger.info("Initializing database schema...");

        try {
            this.db.connect();

            // Read migration script
            const migrationPath = path.join(
                __dirname,
                "../../../scripts/database_migration.sql"
            );

            if (!fs.existsSync(migrationPath)) {
                logger.error(`Migration file not found: ${migrationPath}`);
                throw new Error("Migration file not found");
            }

            const migrationSQL = fs.readFileSync(migrationPath, "utf8");

            // Split SQL by statements (handle multi-line statements)
            const statements = migrationSQL
                .split(";")
                .map((s) => s.trim())
                .filter((s) => s.length > 0 && !s.startsWith("--"));

            let successCount = 0;
            let skipCount = 0;

            for (const statement of statements) {
                try {
                    // Skip comments and empty lines
                    if (
                        statement.startsWith("--") ||
                        statement.length === 0 ||
                        statement.match(/^\s*$/)
                    ) {
                        continue;
                    }

                    this.db.run(statement + ";", []);
                    successCount++;
                } catch (error: any) {
                    // Ignore "already exists" errors
                    if (error.message.includes("already exists")) {
                        skipCount++;
                        continue;
                    }
                    logger.warn(`SQL execution warning: ${error.message}`);
                }
            }

            logger.info(
                `Database schema initialized: ${successCount} statements executed, ${skipCount} skipped`
            );
        } catch (error) {
            logger.error("Failed to initialize database schema:", error);
            throw error;
        }
    }

    /**
     * Fetch available models from Ollama
     */
    async fetchOllamaModels(): Promise<OllamaModel[]> {
        logger.info(`Fetching Ollama models from ${this.ollamaHost}...`);

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${this.ollamaHost}/api/tags`, {
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data = (await response.json()) as OllamaListResponse;

            logger.info(`Found ${data.models?.length || 0} Ollama models`);

            return data.models || [];
        } catch (error: any) {
            if (error.name === "AbortError") {
                logger.error("Ollama connection timeout");
            } else {
                logger.error("Failed to fetch Ollama models:", error.message);
            }
            return [];
        }
    }

    /**
     * Import Ollama models into database
     */
    async importOllamaModels(): Promise<number> {
        logger.info("Importing Ollama models to database...");

        try {
            const models = await this.fetchOllamaModels();

            if (models.length === 0) {
                logger.warn(
                    "No Ollama models found. Make sure Ollama is running and has models installed."
                );
                return 0;
            }

            let importedCount = 0;
            let updatedCount = 0;
            let skippedCount = 0;

            for (const model of models) {
                try {
                    const modelName = model.name;
                    const modelId = model.model || model.name;

                    // Create display name
                    const displayName = this.formatDisplayName(modelName);

                    // Check if model already exists
                    const existing = this.db.get(
                        "SELECT id, name FROM model_configs WHERE model_id = ?",
                        [modelId]
                    );

                    if (existing) {
                        // Update existing model
                        this.db.run(
                            `UPDATE model_configs
                             SET name = ?, display_name = ?, updated_at = CURRENT_TIMESTAMP
                             WHERE model_id = ?`,
                            [modelName, displayName, modelId]
                        );
                        updatedCount++;
                        logger.debug(`Updated model: ${modelName}`);
                    } else {
                        // Insert new model
                        const isDefault = importedCount === 0; // First model is default

                        const config = {
                            size: model.size,
                            family: model.details?.family,
                            format: model.details?.format,
                            parameter_size: model.details?.parameter_size,
                        };

                        this.db.run(
                            `INSERT INTO model_configs
                             (name, display_name, provider, model_id, is_active, is_default, config_json, created_by)
                             VALUES (?, ?, 'ollama', ?, 1, ?, ?, 1)`,
                            [
                                modelName,
                                displayName,
                                modelId,
                                isDefault ? 1 : 0,
                                JSON.stringify(config),
                            ]
                        );

                        importedCount++;
                        logger.info(`Imported model: ${modelName}`);
                    }
                } catch (error) {
                    logger.warn(`Failed to import model ${model.name}:`, error);
                    skippedCount++;
                }
            }

            logger.info(
                `Ollama models import complete: ${importedCount} new, ${updatedCount} updated, ${skippedCount} skipped`
            );

            return importedCount + updatedCount;
        } catch (error) {
            logger.error("Failed to import Ollama models:", error);
            return 0;
        }
    }

    /**
     * Format model name for display
     */
    private formatDisplayName(modelName: string): string {
        // Convert "qwen2.5:0.5b" to "Qwen 2.5 0.5B"
        // Convert "llama3:latest" to "Llama 3 Latest"

        let name = modelName.replace(/[:\-_]/g, " ");
        name = name.replace(/\b\w/g, (char) => char.toUpperCase());
        name = name.replace(/\s+/g, " ").trim();

        // Capitalize 'b' in size (0.5b -> 0.5B)
        name = name.replace(/(\d+\.?\d*)\s*b\b/gi, "$1B");

        return name;
    }

    /**
     * Verify database tables exist
     */
    verifyDatabase(): boolean {
        logger.info("Verifying database tables...");

        const requiredTables = [
            "users",
            "model_configs",
            "user_preferences",
            "chat_sessions",
            "chat_messages",
            "activity_log",
            "system_metrics",
            "vscode_sessions",
            "code_embeddings",
        ];

        try {
            for (const table of requiredTables) {
                const result = this.db.get(
                    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                    [table]
                );

                if (!result) {
                    logger.error(`Required table missing: ${table}`);
                    return false;
                }
            }

            logger.info("All required tables verified");
            return true;
        } catch (error) {
            logger.error("Database verification failed:", error);
            return false;
        }
    }

    /**
     * Get database statistics
     */
    getDatabaseStats(): any {
        try {
            const stats = {
                users: this.db.get("SELECT COUNT(*) as count FROM users")?.count || 0,
                models:
                    this.db.get("SELECT COUNT(*) as count FROM model_configs")?.count ||
                    0,
                sessions:
                    this.db.get("SELECT COUNT(*) as count FROM chat_sessions")?.count ||
                    0,
                messages:
                    this.db.get("SELECT COUNT(*) as count FROM chat_messages")?.count ||
                    0,
                activeModels:
                    this.db.get(
                        "SELECT COUNT(*) as count FROM model_configs WHERE is_active = 1"
                    )?.count || 0,
            };

            return stats;
        } catch (error) {
            logger.error("Failed to get database stats:", error);
            return null;
        }
    }

    /**
     * Full initialization process
     */
    async initialize(): Promise<boolean> {
        try {
            logger.info("🚀 Starting database initialization...");

            // Step 1: Initialize schema
            await this.initializeSchema();

            // Step 2: Verify tables
            if (!this.verifyDatabase()) {
                throw new Error("Database verification failed");
            }

            // Step 3: Import Ollama models
            const importedCount = await this.importOllamaModels();

            // Step 4: Get stats
            const stats = this.getDatabaseStats();

            logger.info("✅ Database initialization complete!");
            logger.info("📊 Database Statistics:", stats);

            if (importedCount > 0) {
                logger.info(`🤖 Imported ${importedCount} Ollama models`);
            } else {
                logger.warn(
                    "⚠️ No Ollama models imported. Check if Ollama is running."
                );
            }

            return true;
        } catch (error) {
            logger.error("❌ Database initialization failed:", error);
            return false;
        }
    }

    /**
     * Close database connection
     */
    close(): void {
        this.db.close();
    }
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
    const initializer = new DatabaseInitializer();

    initializer
        .initialize()
        .then((success) => {
            initializer.close();
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            logger.error("Initialization error:", error);
            initializer.close();
            process.exit(1);
        });
}

export default DatabaseInitializer;
