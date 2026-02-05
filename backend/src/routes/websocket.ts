import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { logger } from "../utils/logger.js";
import { LLMService } from "../services/llmService.js";
import { DatabaseManager } from "../utils/database.js";
import { URL } from "url";

interface VSCodeWebSocketMessage {
    type: "chat" | "ping" | "session" | "model_switch";
    id?: string;
    data?: any;
    sessionId?: string;
    vscodeVersion?: string;
    workspaceRoot?: string;
}

interface WebSocketSession {
    id: string;
    socket: WebSocket;
    vscodeVersion?: string;
    workspaceRoot?: string;
    lastActivity: number;
    user?: string;
}

class WebSocketManager {
    private sessions = new Map<string, WebSocketSession>();
    private llmService = new LLMService();
    private db = new DatabaseManager();
    private heartbeatInterval: NodeJS.Timeout;

    constructor() {
        // Clean up inactive sessions every 30 seconds
        this.heartbeatInterval = setInterval(() => {
            this.cleanupInactiveSessions();
        }, 30000);
    }

    handleConnection(ws: WebSocket, request: IncomingMessage): void {
        try {
            // Extract VS Code context from headers or query params
            const url = new URL(request.url || "", `http://${request.headers.host}`);
            const sessionId =
                (request.headers["x-session-id"] as string) ||
                url.searchParams.get("sessionId") ||
                `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const vscodeVersion = request.headers["x-vs-code-version"] as string;
            const workspaceRoot = request.headers["x-workspace-root"] as string;
            const userAgent = request.headers["user-agent"] as string;

            // Create session
            const session: WebSocketSession = {
                id: sessionId,
                socket: ws,
                vscodeVersion,
                workspaceRoot,
                lastActivity: Date.now(),
                user: "default",
            };

            this.sessions.set(sessionId, session);

            logger.info("WebSocket connection established", {
                sessionId,
                vscodeVersion,
                workspaceRoot: workspaceRoot ? "present" : "none",
                userAgent: userAgent?.includes("vscode") ? "vscode" : "other",
                totalSessions: this.sessions.size,
            });

            // Log VS Code session start
            if (userAgent?.includes("vscode")) {
                this.db.logActivity(1, "websocket_connected", "vscode_extension", {
                    sessionId,
                    vscodeVersion,
                    workspaceRoot,
                    transport: "websocket",
                });
            }

            // Send welcome message
            this.sendMessage(ws, {
                type: "session",
                data: {
                    sessionId,
                    status: "connected",
                    server: "ZombieCoder WebSocket Server",
                    version: "2.0.0",
                    capabilities: [
                        "streaming_chat",
                        "model_switching",
                        "real_time_updates",
                        "vscode_integration",
                    ],
                },
            });

            // Set up event handlers
            this.setupEventHandlers(ws, session);
        } catch (error) {
            logger.error("Error setting up WebSocket connection:", error);
            ws.close(1011, "Setup failed");
        }
    }

    private setupEventHandlers(ws: WebSocket, session: WebSocketSession): void {
        ws.on("message", async (data) => {
            try {
                session.lastActivity = Date.now();
                const message = JSON.parse(data.toString()) as VSCodeWebSocketMessage;

                logger.debug("WebSocket message received", {
                    sessionId: session.id,
                    type: message.type,
                    id: message.id,
                });

                await this.handleMessage(ws, session, message);
            } catch (error) {
                logger.error("Error handling WebSocket message:", error);
                this.sendMessage(ws, {
                    type: "error",
                    data: {
                        error: "Failed to process message",
                        details: error instanceof Error ? error.message : "Unknown error",
                    },
                });
            }
        });

        ws.on("close", (code, reason) => {
            logger.info("WebSocket connection closed", {
                sessionId: session.id,
                code,
                reason: reason.toString(),
                duration: Date.now() - session.lastActivity,
            });

            // Log session end
            this.db.logActivity(1, "websocket_disconnected", "vscode_extension", {
                sessionId: session.id,
                code,
                reason: reason.toString(),
                duration: Date.now() - session.lastActivity,
            });

            this.sessions.delete(session.id);
        });

        ws.on("error", (error) => {
            logger.error("WebSocket error", {
                sessionId: session.id,
                error: error.message,
            });

            this.db.logActivity(1, "websocket_error", "vscode_extension", {
                sessionId: session.id,
                error: error.message,
            });
        });

        ws.on("pong", () => {
            session.lastActivity = Date.now();
        });
    }

    private async handleMessage(
        ws: WebSocket,
        session: WebSocketSession,
        message: VSCodeWebSocketMessage,
    ): Promise<void> {
        switch (message.type) {
            case "ping":
                this.sendMessage(ws, {
                    type: "pong",
                    id: message.id,
                    data: { timestamp: Date.now() },
                });
                break;

            case "chat":
                await this.handleChatMessage(ws, session, message);
                break;

            case "session":
                await this.handleSessionMessage(ws, session, message);
                break;

            case "model_switch":
                await this.handleModelSwitch(ws, session, message);
                break;

            default:
                this.sendMessage(ws, {
                    type: "error",
                    id: message.id,
                    data: {
                        error: "Unknown message type",
                        type: message.type,
                    },
                });
        }
    }

    private async handleChatMessage(
        ws: WebSocket,
        session: WebSocketSession,
        message: VSCodeWebSocketMessage,
    ): Promise<void> {
        try {
            const { prompt, context, model } = message.data || {};

            if (!prompt) {
                this.sendMessage(ws, {
                    type: "error",
                    id: message.id,
                    data: { error: "Prompt is required" },
                });
                return;
            }

            // Build enhanced context with VS Code session info
            const enhancedContext = {
                ...context,
                vscode: {
                    sessionId: session.id,
                    version: session.vscodeVersion,
                    workspaceRoot: session.workspaceRoot,
                },
            };

            // Build system prompt
            const systemPrompt = this.buildSystemPrompt(enhancedContext, session);

            // Get available model
            const availableModels = this.db.getAvailableModels();
            const selectedModel =
                model ||
                (availableModels.length > 0 ? availableModels[0].model_id : "qwen2.5:0.5b");

            logger.info("Starting WebSocket chat stream", {
                sessionId: session.id,
                model: selectedModel,
                promptLength: prompt.length,
            });

            // Log chat request
            this.db.logActivity(1, "websocket_chat_request", "vscode_extension", {
                sessionId: session.id,
                model: selectedModel,
                hasContext: !!context,
                promptLength: prompt.length,
            });

            // Send start indicator
            this.sendMessage(ws, {
                type: "chat_start",
                id: message.id,
                data: { model: selectedModel },
            });

            // Stream response
            let fullResponse = "";
            try {
                for await (const chunk of this.llmService.streamChat(
                    systemPrompt,
                    prompt,
                    selectedModel,
                )) {
                    if (ws.readyState !== WebSocket.OPEN) {
                        logger.info("WebSocket closed during streaming, stopping");
                        break;
                    }

                    fullResponse += chunk;

                    this.sendMessage(ws, {
                        type: "chat_chunk",
                        id: message.id,
                        data: {
                            content: chunk,
                            model: selectedModel,
                        },
                    });
                }

                // Send completion
                this.sendMessage(ws, {
                    type: "chat_complete",
                    id: message.id,
                    data: {
                        fullResponse,
                        model: selectedModel,
                        responseLength: fullResponse.length,
                    },
                });

                logger.info("WebSocket chat stream completed", {
                    sessionId: session.id,
                    responseLength: fullResponse.length,
                });
            } catch (streamError) {
                logger.error("Error during WebSocket streaming:", streamError);

                this.sendMessage(ws, {
                    type: "chat_error",
                    id: message.id,
                    data: {
                        error:
                            streamError instanceof Error ? streamError.message : "Streaming failed",
                    },
                });
            }
        } catch (error) {
            logger.error("Error handling chat message:", error);

            this.sendMessage(ws, {
                type: "chat_error",
                id: message.id,
                data: {
                    error: error instanceof Error ? error.message : "Chat failed",
                },
            });
        }
    }

    private async handleSessionMessage(
        ws: WebSocket,
        session: WebSocketSession,
        message: VSCodeWebSocketMessage,
    ): Promise<void> {
        const { action, data } = message.data || {};

        switch (action) {
            case "update_context":
                if (data?.vscodeVersion) session.vscodeVersion = data.vscodeVersion;
                if (data?.workspaceRoot) session.workspaceRoot = data.workspaceRoot;

                this.sendMessage(ws, {
                    type: "session_updated",
                    id: message.id,
                    data: {
                        sessionId: session.id,
                        updated: true,
                    },
                });
                break;

            case "get_info":
                this.sendMessage(ws, {
                    type: "session_info",
                    id: message.id,
                    data: {
                        sessionId: session.id,
                        vscodeVersion: session.vscodeVersion,
                        workspaceRoot: session.workspaceRoot,
                        lastActivity: session.lastActivity,
                        uptime: Date.now() - session.lastActivity,
                    },
                });
                break;
        }
    }

    private async handleModelSwitch(
        ws: WebSocket,
        session: WebSocketSession,
        message: VSCodeWebSocketMessage,
    ): Promise<void> {
        try {
            const { modelId } = message.data || {};

            if (!modelId) {
                this.sendMessage(ws, {
                    type: "model_switch_error",
                    id: message.id,
                    data: { error: "Model ID is required" },
                });
                return;
            }

            // Check if model is available
            const availableModels = this.db.getAvailableModels();
            const modelExists = availableModels.some((m) => m.model_id === modelId);

            if (!modelExists) {
                this.sendMessage(ws, {
                    type: "model_switch_error",
                    id: message.id,
                    data: {
                        error: "Model not available",
                        availableModels: availableModels.map((m) => m.model_id),
                    },
                });
                return;
            }

            // Log model switch
            this.db.logActivity(1, "model_switched", "vscode_extension", {
                sessionId: session.id,
                modelId,
                previousModel: "unknown",
            });

            this.sendMessage(ws, {
                type: "model_switched",
                id: message.id,
                data: {
                    modelId,
                    success: true,
                },
            });

            logger.info("Model switched via WebSocket", {
                sessionId: session.id,
                modelId,
            });
        } catch (error) {
            logger.error("Error switching model:", error);

            this.sendMessage(ws, {
                type: "model_switch_error",
                id: message.id,
                data: {
                    error: error instanceof Error ? error.message : "Model switch failed",
                },
            });
        }
    }

    private sendMessage(ws: WebSocket, message: any): void {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(message));
            } catch (error) {
                logger.error("Error sending WebSocket message:", error);
            }
        }
    }

    private buildSystemPrompt(context: any, session: WebSocketSession): string {
        let systemPrompt = `You are ZombieCoder, an AI code assistant integrated with VS Code via WebSocket. You provide real-time assistance to developers.

Key capabilities:
- Real-time streaming responses
- VS Code workspace integration
- Multi-language support (Bengali & English)
- Code analysis and generation

VS Code Session Context:
- Session ID: ${session.id}
- VS Code Version: ${session.vscodeVersion || "Unknown"}
- Workspace: ${session.workspaceRoot || "No workspace"}
- Connection: WebSocket (real-time)

`;

        if (context?.activeFile) {
            systemPrompt += `Current file: ${context.activeFile.path} (${context.activeFile.language})\n`;

            if (context.activeFile.selection) {
                systemPrompt += `Selected code:\n\`\`\`${context.activeFile.language}\n${context.activeFile.selection.text}\n\`\`\`\n`;
            }
        }

        return systemPrompt;
    }

    private cleanupInactiveSessions(): void {
        const now = Date.now();
        const timeout = 5 * 60 * 1000; // 5 minutes

        for (const [sessionId, session] of this.sessions) {
            if (now - session.lastActivity > timeout) {
                logger.info("Cleaning up inactive WebSocket session", {
                    sessionId,
                    inactiveFor: now - session.lastActivity,
                });

                if (session.socket.readyState === WebSocket.OPEN) {
                    session.socket.close(1000, "Session timeout");
                }

                this.sessions.delete(sessionId);
            }
        }
    }

    // Send ping to all active sessions
    pingAllSessions(): void {
        for (const session of this.sessions.values()) {
            if (session.socket.readyState === WebSocket.OPEN) {
                try {
                    session.socket.ping();
                } catch (error) {
                    logger.warn("Failed to ping session", {
                        sessionId: session.id,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                }
            }
        }
    }

    getSessionCount(): number {
        return this.sessions.size;
    }

    getActiveSessions(): string[] {
        return Array.from(this.sessions.keys());
    }

    cleanup(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        // Close all sessions
        for (const session of this.sessions.values()) {
            if (session.socket.readyState === WebSocket.OPEN) {
                session.socket.close(1001, "Server shutdown");
            }
        }

        this.sessions.clear();
    }
}

// Create singleton instance
const wsManager = new WebSocketManager();

// Export the connection handler for use in server setup
export function handleWebSocketConnection(ws: WebSocket, request: IncomingMessage): void {
    wsManager.handleConnection(ws, request);
}

// Export additional methods for server management
export const getWebSocketStats = () => ({
    activeConnections: wsManager.getSessionCount(),
    activeSessions: wsManager.getActiveSessions(),
});

export const cleanupWebSocket = () => wsManager.cleanup();
export const pingAllWebSocketSessions = () => wsManager.pingAllSessions();
