import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import { DatabaseManager } from "../utils/database.js";
import os from "os";

export const adminRouter = Router();
const db = new DatabaseManager();

// Admin authentication middleware
const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    // For now, simple check - in production, use proper JWT verification
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized - Missing token" });
    }

    // TODO: Implement proper JWT verification
    // For development, accept any token
    next();
};

// Runtime status endpoint
adminRouter.get("/runtime_status", (req: Request, res: Response) => {
    try {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        // Check Ollama status
        let ollamaStatus = "unknown";
        let ollamaModels: any[] = [];

        // Check database status
        let dbStatus = "unknown";
        try {
            const health = db.healthCheck();
            dbStatus = health.status;
        } catch {
            dbStatus = "error";
        }

        // Get available models from database
        let configuredModels: any[] = [];
        try {
            configuredModels = db.getAvailableModels();
        } catch (error) {
            logger.warn("Failed to get configured models:", error);
        }

        const runtimeStatus = {
            server: {
                status: "running",
                uptime: Math.floor(uptime),
                uptimeFormatted: formatUptime(uptime),
                version: process.env.npm_package_version || "2.0.0",
                nodeVersion: process.version,
                platform: os.platform(),
                arch: os.arch(),
            },
            resources: {
                memory: {
                    used: Math.round(memoryUsage.rss / 1024 / 1024), // MB
                    heap: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                    external: Math.round(memoryUsage.external / 1024 / 1024), // MB
                    total: Math.round(os.totalmem() / 1024 / 1024), // MB
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system,
                    loadAverage: os.loadavg(),
                },
            },
            services: {
                database: {
                    status: dbStatus,
                    type: "sqlite",
                    modelsConfigured: configuredModels.length,
                },
                ollama: {
                    status: ollamaStatus,
                    endpoint: process.env.OLLAMA_HOST || "http://localhost:11434",
                    modelsAvailable: ollamaModels.length,
                },
            },
            models: {
                configured: configuredModels.map((model) => ({
                    id: model.id,
                    name: model.name,
                    displayName: model.display_name,
                    provider: model.provider,
                    isDefault: model.is_default === 1,
                    isActive: model.is_active === 1,
                })),
            },
            timestamp: new Date().toISOString(),
        };

        logger.info("Runtime status requested");
        res.json(runtimeStatus);
    } catch (error) {
        logger.error("Error getting runtime status:", error);
        res.status(500).json({
            error: "Failed to get runtime status",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

// Runtime agent info endpoint
adminRouter.get("/runtime_agent", async (req: Request, res: Response) => {
    try {
        // Get available models from Ollama
        let availableModels: any[] = [];
        let ollamaStatus = "offline";

        try {
            const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
            const response = await fetch(`${ollamaHost}/api/tags`, {
                signal: AbortSignal.timeout(5000),
            });

            if (response.ok) {
                const data = await response.json();
                availableModels = data.models || [];
                ollamaStatus = "online";
            }
        } catch (error) {
            logger.warn("Failed to fetch Ollama models:", error);
        }

        // Get database models
        let configuredModels: any[] = [];
        try {
            configuredModels = db.getAvailableModels();
        } catch (error) {
            logger.warn("Failed to fetch configured models:", error);
        }

        // Get statistics
        let statistics = {
            totalSessions: 0,
            activeConnections: 0,
            totalMessages: 0,
            avgResponseTime: 0,
        };

        try {
            const metrics = db.getSystemMetrics();
            const sessionMetric = metrics.find((m) => m.metric === "total_sessions");
            const messageMetric = metrics.find((m) => m.metric === "total_messages");

            if (sessionMetric) statistics.totalSessions = sessionMetric.value;
            if (messageMetric) statistics.totalMessages = messageMetric.value;
        } catch (error) {
            logger.warn("Failed to fetch statistics:", error);
        }

        const agentInfo = {
            agent: {
                name: "ZombieCoder",
                version: "2.0.0",
                description: "আমি ZombieCoder, যেখানে কোড ও কথা বলে।",
                capabilities: [
                    "code_generation",
                    "code_explanation",
                    "debugging",
                    "refactoring",
                    "chat",
                    "streaming_responses",
                    "multi_model_support",
                    "ollama_integration",
                ],
                supportedLanguages: ["bengali", "english"],
                features: {
                    streaming: true,
                    websocket: true,
                    rag: process.env.ENABLE_RAG === "true",
                    terminal_commands: process.env.ENABLE_TERMINAL_COMMANDS === "true",
                    ollama: ollamaStatus === "online",
                },
            },
            models: {
                available: availableModels.map((model) => ({
                    name: model.name,
                    size: model.size,
                    modified: model.modified_at,
                    family: model.details?.family,
                    format: model.details?.format,
                })),
                configured: configuredModels.map((model) => ({
                    id: model.id,
                    name: model.name,
                    displayName: model.display_name,
                    provider: model.provider,
                    modelId: model.model_id,
                    isDefault: model.is_default === 1,
                    isActive: model.is_active === 1,
                    maxTokens: model.max_tokens,
                    temperature: model.temperature,
                })),
            },
            statistics,
            timestamp: new Date().toISOString(),
        };

        logger.info("Runtime agent info requested");
        res.json(agentInfo);
    } catch (error) {
        logger.error("Error getting runtime agent info:", error);
        res.status(500).json({
            error: "Failed to get runtime agent info",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

// Admin dashboard metrics
adminRouter.get("/metrics", adminAuth, (req: Request, res: Response) => {
    try {
        // Get basic metrics
        let userCount = 0;
        let sessionCount = 0;
        let messageCount = 0;
        let modelCount = 0;

        try {
            const userResult = db.get("SELECT COUNT(*) as count FROM users WHERE is_active = 1");
            userCount = userResult?.count || 0;

            const sessionResult = db.get(`
                SELECT COUNT(*) as count FROM chat_sessions
                WHERE created_at > datetime('now', '-24 hours')
            `);
            sessionCount = sessionResult?.count || 0;

            const messageResult = db.get(`
                SELECT COUNT(*) as count FROM chat_messages
                WHERE created_at > datetime('now', '-24 hours')
            `);
            messageCount = messageResult?.count || 0;

            const modelResult = db.get(
                "SELECT COUNT(*) as count FROM model_configs WHERE is_active = 1",
            );
            modelCount = modelResult?.count || 0;
        } catch (error) {
            logger.warn("Failed to get basic metrics:", error);
        }

        // Get recent activity
        let recentActivity: any[] = [];
        try {
            recentActivity = db.query(`
                SELECT action, resource_type, details, created_at, u.username
                FROM activity_log al
                LEFT JOIN users u ON al.user_id = u.id
                ORDER BY al.created_at DESC
                LIMIT 10
            `);
        } catch (error) {
            logger.warn("Failed to get recent activity:", error);
        }

        // Get system metrics
        let systemMetrics: any[] = [];
        try {
            systemMetrics = db.getSystemMetrics();
        } catch (error) {
            logger.warn("Failed to get system metrics:", error);
        }

        // Get memory and CPU info
        const memoryUsage = process.memoryUsage();
        const cpuUsage = os.loadavg();

        const metrics = {
            overview: {
                activeUsers: userCount,
                sessionsToday: sessionCount,
                messagesToday: messageCount,
                activeModels: modelCount,
            },
            system: {
                uptime: Math.floor(process.uptime()),
                memory: {
                    used: Math.round(memoryUsage.rss / 1024 / 1024),
                    heap: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    total: Math.round(os.totalmem() / 1024 / 1024),
                },
                cpu: {
                    load1: cpuUsage[0],
                    load5: cpuUsage[1],
                    load15: cpuUsage[2],
                },
            },
            activity: recentActivity.map((activity) => ({
                action: activity.action,
                resourceType: activity.resource_type,
                username: activity.username || "System",
                details: activity.details ? JSON.parse(activity.details) : {},
                timestamp: activity.created_at,
            })),
            metrics: systemMetrics.map((metric) => ({
                name: metric.metric,
                value: metric.value,
                unit: metric.unit,
                timestamp: metric.timestamp,
            })),
            timestamp: new Date().toISOString(),
        };

        res.json(metrics);
    } catch (error) {
        logger.error("Error getting admin metrics:", error);
        res.status(500).json({
            error: "Failed to get admin metrics",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

// Models management
adminRouter.get("/models", (req: Request, res: Response) => {
    try {
        const models = db.query(`
            SELECT
                mc.*,
                u.username as created_by_username,
                COUNT(cs.id) as usage_count
            FROM model_configs mc
            LEFT JOIN users u ON mc.created_by = u.id
            LEFT JOIN chat_sessions cs ON mc.id = cs.model_id
            GROUP BY mc.id
            ORDER BY mc.is_default DESC, mc.display_name
        `);

        const formattedModels = models.map((model) => ({
            id: model.id,
            name: model.name,
            displayName: model.display_name,
            provider: model.provider,
            modelId: model.model_id,
            endpointUrl: model.endpoint_url,
            maxTokens: model.max_tokens,
            temperature: model.temperature,
            topP: model.top_p,
            isActive: model.is_active === 1,
            isDefault: model.is_default === 1,
            usageCount: model.usage_count || 0,
            createdBy: model.created_by_username,
            createdAt: model.created_at,
            updatedAt: model.updated_at,
        }));

        res.json({
            models: formattedModels,
            total: formattedModels.length,
            active: formattedModels.filter((m) => m.isActive).length,
        });
    } catch (error) {
        logger.error("Error getting models:", error);
        res.status(500).json({
            error: "Failed to get models",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

// Add new model
adminRouter.post("/models", adminAuth, (req: Request, res: Response) => {
    try {
        const {
            name,
            displayName,
            provider,
            modelId,
            endpointUrl,
            maxTokens = 4096,
            temperature = 0.7,
            topP = 1.0,
            isDefault = false,
        } = req.body;

        if (!name || !displayName || !provider || !modelId) {
            return res.status(400).json({
                error: "Missing required fields: name, displayName, provider, modelId",
            });
        }

        // If this is set as default, unset other defaults
        if (isDefault) {
            db.run("UPDATE model_configs SET is_default = 0");
        }

        const result = db.run(
            `
            INSERT INTO model_configs (
                name, display_name, provider, model_id, endpoint_url,
                max_tokens, temperature, top_p,
                is_active, is_default, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1)
        `,
            [
                name,
                displayName,
                provider,
                modelId,
                endpointUrl,
                maxTokens,
                temperature,
                topP,
                isDefault ? 1 : 0,
            ],
        );

        // Log activity
        db.logActivity(1, "model_created", "model", {
            modelId: result.lastID,
            name: displayName,
            provider,
        });

        logger.info(`New model added: ${displayName}`, { modelId: result.lastID });

        res.status(201).json({
            id: result.lastID,
            message: "Model added successfully",
        });
    } catch (error) {
        logger.error("Error adding model:", error);
        res.status(500).json({
            error: "Failed to add model",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

// Delete model
adminRouter.delete("/models/:id", adminAuth, (req: Request, res: Response) => {
    try {
        const modelId = parseInt(req.params.id);

        if (!modelId || isNaN(modelId)) {
            return res.status(400).json({ error: "Invalid model ID" });
        }

        // Get model info before deletion
        const model = db.get("SELECT * FROM model_configs WHERE id = ?", [modelId]);

        if (!model) {
            return res.status(404).json({ error: "Model not found" });
        }

        // Delete the model
        const result = db.run("DELETE FROM model_configs WHERE id = ?", [modelId]);

        if (result.changes > 0) {
            // Log activity
            db.logActivity(1, "model_deleted", "model", {
                modelId,
                name: model.display_name,
                provider: model.provider,
            });

            logger.info(`Model deleted: ${model.display_name}`);

            res.json({
                message: "Model deleted successfully",
                deletedModel: {
                    id: model.id,
                    name: model.display_name,
                },
            });
        } else {
            res.status(404).json({ error: "Model not found" });
        }
    } catch (error) {
        logger.error("Error deleting model:", error);
        res.status(500).json({
            error: "Failed to delete model",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

// Update model
adminRouter.put("/models/:id", adminAuth, (req: Request, res: Response) => {
    try {
        const modelId = parseInt(req.params.id);
        const { displayName, maxTokens, temperature, topP, isActive, isDefault } = req.body;

        if (!modelId || isNaN(modelId)) {
            return res.status(400).json({ error: "Invalid model ID" });
        }

        // If this is set as default, unset other defaults
        if (isDefault) {
            db.run("UPDATE model_configs SET is_default = 0");
        }

        const result = db.run(
            `
            UPDATE model_configs
            SET display_name = ?, max_tokens = ?, temperature = ?, top_p = ?,
                is_active = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `,
            [
                displayName,
                maxTokens,
                temperature,
                topP,
                isActive ? 1 : 0,
                isDefault ? 1 : 0,
                modelId,
            ],
        );

        if (result.changes > 0) {
            // Log activity
            db.logActivity(1, "model_updated", "model", {
                modelId,
                changes: { displayName, maxTokens, temperature, topP, isActive, isDefault },
            });

            res.json({ message: "Model updated successfully" });
        } else {
            res.status(404).json({ error: "Model not found" });
        }
    } catch (error) {
        logger.error("Error updating model:", error);
        res.status(500).json({
            error: "Failed to update model",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

// System health check
adminRouter.get("/health", (req: Request, res: Response) => {
    try {
        const dbHealth = db.healthCheck();

        res.json({
            status: "ok",
            service: "ZombieCoder Admin API",
            version: "2.0.0",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "development",
            database: dbHealth,
        });
    } catch (error) {
        logger.error("Health check failed:", error);
        res.status(500).json({
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

// Helper functions
function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(" ");
}
