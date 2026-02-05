import { Router } from "express";
import type { Request, Response } from "express";
import type { ChatRequest, StreamResponse } from "../types/index.js";
import { LLMService } from "../services/llmService.js";
import { DiffService } from "../services/diffService.js";
import { logger } from "../utils/logger.js";
import { DatabaseManager } from "../utils/database.js";

export const chatRouter = Router();
const llmService = new LLMService();
const diffService = new DiffService();
const db = new DatabaseManager();

// VS Code specific middleware to handle headers and authentication
const vscodeAuthMiddleware = (req: Request, res: Response, next: Function) => {
    const userAgent = req.headers["user-agent"];
    const vscodeVersion = req.headers["x-vs-code-version"];
    const sessionId = req.headers["x-session-id"];
    const workspaceRoot = req.headers["x-workspace-root"];

    // Enhanced context for VS Code requests
    if (userAgent && userAgent.includes("vscode")) {
        (req as any).vscodeContext = {
            source: "vscode-extension",
            sessionId: sessionId,
            workspaceRoot: workspaceRoot,
            vscodeVersion: vscodeVersion,
            activeLanguage: req.headers["x-active-language"],
            filePath: req.headers["x-file-path"],
        };

        logger.info("VS Code request detected", {
            sessionId: sessionId,
            workspace: workspaceRoot,
            version: vscodeVersion,
        });
    }

    next();
};

// Apply VS Code middleware
chatRouter.use(vscodeAuthMiddleware);

// Streaming chat endpoint (SSE)
chatRouter.post("/stream", async (req: Request, res: Response) => {
    try {
        const {
            prompt,
            context,
            model,
            stream = true,
        } = req.body as ChatRequest & { stream?: boolean };
        const vscodeContext = (req as any).vscodeContext;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // Set SSE headers for streaming
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization, X-VS-Code-Version, X-Session-ID, X-Workspace-Root",
        );
        res.flushHeaders();

        logger.info("Starting chat stream", {
            prompt: prompt.substring(0, 50),
            model: model || "default",
            vscode: !!vscodeContext,
            sessionId: vscodeContext?.sessionId,
        });

        // Build enhanced system prompt with VS Code context
        const systemPrompt = buildSystemPrompt(context, vscodeContext);

        // Check if model is available
        const availableModels = db.getAvailableModels();
        const selectedModel =
            model || (availableModels.length > 0 ? availableModels[0].model_id : "qwen2.5:0.5b");

        // Log activity if VS Code context available
        if (vscodeContext?.sessionId) {
            db.logActivity(1, "chat_request", "vscode_extension", {
                sessionId: vscodeContext.sessionId,
                model: selectedModel,
                hasContext: !!context,
                promptLength: prompt.length,
            });
        }

        // Stream LLM response
        let fullResponse = "";
        let hasError = false;

        try {
            for await (const chunk of llmService.streamChat(systemPrompt, prompt, selectedModel)) {
                if (req.destroyed) {
                    logger.info("Client disconnected, stopping stream");
                    break;
                }

                fullResponse += chunk;

                const response: StreamResponse = {
                    type: "token",
                    content: chunk,
                };

                res.write(`data: ${JSON.stringify(response)}\n\n`);
            }

            // Check if response contains code changes
            if (fullResponse && vscodeContext) {
                const diffs = diffService.extractDiffs(fullResponse, context);

                // Send diffs if found
                for (const diff of diffs) {
                    const response: StreamResponse = {
                        type: "diff",
                        diff,
                    };
                    res.write(`data: ${JSON.stringify(response)}\n\n`);
                }
            }

            // Send completion signal
            const doneResponse: StreamResponse = { type: "done" };
            res.write(`data: ${JSON.stringify(doneResponse)}\n\n`);
        } catch (error) {
            logger.error("Error in chat stream:", error);
            hasError = true;

            const errorResponse: StreamResponse = {
                type: "error",
                error: error instanceof Error ? error.message : "Unknown error",
            };

            res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
        }

        res.end();
        logger.info("Chat stream completed", {
            success: !hasError,
            responseLength: fullResponse.length,
            sessionId: vscodeContext?.sessionId,
        });
    } catch (error) {
        logger.error("Error in chat stream setup:", error);

        // Set headers if not already set
        if (!res.headersSent) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
        }

        const errorResponse: StreamResponse = {
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
        };

        res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
        res.end();
    }
});

// Non-streaming chat endpoint
chatRouter.post("/", async (req: Request, res: Response) => {
    try {
        const { prompt, context, model } = req.body as ChatRequest;
        const vscodeContext = (req as any).vscodeContext;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        logger.info("Processing chat request", {
            prompt: prompt.substring(0, 50),
            vscode: !!vscodeContext,
            sessionId: vscodeContext?.sessionId,
        });

        // Build enhanced system prompt
        const systemPrompt = buildSystemPrompt(context, vscodeContext);

        // Get available model
        const availableModels = db.getAvailableModels();
        const selectedModel =
            model || (availableModels.length > 0 ? availableModels[0].model_id : "qwen2.5:0.5b");

        // Generate response
        const response = await llmService.chat(systemPrompt, prompt, selectedModel);

        // Extract diffs if VS Code context available
        let diffs: any[] = [];
        if (vscodeContext) {
            diffs = diffService.extractDiffs(response, context);
        }

        // Log activity
        if (vscodeContext?.sessionId) {
            db.logActivity(1, "chat_completed", "vscode_extension", {
                sessionId: vscodeContext.sessionId,
                model: selectedModel,
                responseLength: response.length,
                diffsFound: diffs.length,
            });
        }

        res.json({
            response,
            diffs,
            model: selectedModel,
            metadata: {
                vscode: !!vscodeContext,
                sessionId: vscodeContext?.sessionId,
                timestamp: new Date().toISOString(),
            },
        });

        logger.info("Chat request completed", {
            responseLength: response.length,
            sessionId: vscodeContext?.sessionId,
        });
    } catch (error) {
        logger.error("Error in chat:", error);

        // Provide VS Code specific error information
        let errorMessage = error instanceof Error ? error.message : "Unknown error";

        if (errorMessage.includes("OPENAI_API_KEY")) {
            errorMessage +=
                " Please configure OpenAI API key or ensure Ollama is running with available models.";
        }

        res.status(500).json({
            error: errorMessage,
            vscode: !!(req as any).vscodeContext,
            availableModels: db.getAvailableModels().map((m) => m.model_id),
            troubleshooting: {
                checkBackend: `curl ${req.protocol}://${req.get("host")}/v1/health`,
                checkModels: `curl ${req.protocol}://${req.get("host")}/api/models`,
                ollamaStatus: "Run 'ollama list' to check available models",
            },
        });
    }
});

// Model availability endpoint for VS Code
chatRouter.get("/models", async (req: Request, res: Response) => {
    try {
        const vscodeContext = (req as any).vscodeContext;
        const availableModels = db.getAvailableModels();

        // Get Ollama models if available
        let ollamaModels: any[] = [];
        try {
            const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
            const response = await fetch(`${ollamaHost}/api/tags`, {
                signal: AbortSignal.timeout(5000),
            });

            if (response.ok) {
                const data = await response.json();
                ollamaModels = data.models || [];
            }
        } catch (error) {
            logger.warn("Failed to fetch Ollama models:", error);
        }

        res.json({
            configured: availableModels.map((model) => ({
                id: model.id,
                name: model.name,
                displayName: model.display_name,
                provider: model.provider,
                modelId: model.model_id,
                isDefault: model.is_default === 1,
                isActive: model.is_active === 1,
            })),
            ollama: ollamaModels.map((model) => ({
                name: model.name,
                size: model.size,
                provider: "ollama",
                available: true,
            })),
            vscode: !!vscodeContext,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error("Error getting models:", error);
        res.status(500).json({
            error: "Failed to get models",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

// VS Code session management
chatRouter.post("/session", async (req: Request, res: Response) => {
    try {
        const { action } = req.body;
        const vscodeContext = (req as any).vscodeContext;

        if (!vscodeContext) {
            return res.status(400).json({ error: "VS Code context required" });
        }

        switch (action) {
            case "start":
                db.logActivity(1, "session_started", "vscode_extension", {
                    sessionId: vscodeContext.sessionId,
                    vscodeVersion: vscodeContext.vscodeVersion,
                    workspaceRoot: vscodeContext.workspaceRoot,
                });
                break;

            case "end":
                db.logActivity(1, "session_ended", "vscode_extension", {
                    sessionId: vscodeContext.sessionId,
                });
                break;
        }

        res.json({
            success: true,
            sessionId: vscodeContext.sessionId,
            action,
        });
    } catch (error) {
        logger.error("Error managing session:", error);
        res.status(500).json({
            error: "Failed to manage session",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

function buildSystemPrompt(context: any, vscodeContext?: any): string {
    let systemPrompt = `You are ZombieCoder (আমি ZombieCoder), an AI code assistant integrated with VS Code. You help developers write, understand, and improve code.

Key capabilities:
- Code generation and explanation in Bengali and English
- Debugging and refactoring assistance
- Multi-language support
- Integration with VS Code editor context

When suggesting code changes:
1. Provide clear explanations in Bengali or English
2. Use proper code formatting with language tags
3. For file modifications, use unified diff format
4. Be concise but thorough
5. Consider the VS Code workspace context

`;

    // Add VS Code specific context
    if (vscodeContext) {
        systemPrompt += `\nVS Code Integration Context:
- Session ID: ${vscodeContext.sessionId}
- VS Code Version: ${vscodeContext.vscodeVersion}
- Workspace: ${vscodeContext.workspaceRoot || "No workspace"}
`;

        if (vscodeContext.activeLanguage) {
            systemPrompt += `- Current Language: ${vscodeContext.activeLanguage}\n`;
        }

        if (vscodeContext.filePath) {
            systemPrompt += `- Active File: ${vscodeContext.filePath}\n`;
        }
    }

    // Add regular context
    if (context?.activeFile) {
        systemPrompt += `\nCurrent file: ${context.activeFile.path} (${context.activeFile.language})\n`;

        if (context.activeFile.selection) {
            systemPrompt += `\nSelected code:\n\`\`\`${context.activeFile.language}\n${context.activeFile.selection.text}\n\`\`\`\n`;
        }
    }

    if (context?.workspaceRoot) {
        systemPrompt += `\nWorkspace: ${context.workspaceRoot}\n`;
    }

    if (context?.diagnostics && context.diagnostics.length > 0) {
        systemPrompt += `\nCurrent issues:\n`;
        context.diagnostics.forEach((d: any) => {
            systemPrompt += `- ${d.file}:${d.line} [${d.severity}] ${d.message}\n`;
        });
    }

    return systemPrompt;
}
