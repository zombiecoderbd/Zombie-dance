import { Router, Request, Response } from "express";
import { LLMService } from "../services/llmService.js";
import { DatabaseManager } from "../utils/database.js";
import { logger } from "../utils/logger.js";
import {
    modelAliasMiddleware,
    restoreModelNameMiddleware,
    resolveModelAlias,
    getSupportedModels,
} from "../middleware/modelAlias.js";

const openaiRouter = Router();
const llmService = new LLMService();
const db = new DatabaseManager();

interface OpenAIMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface OpenAIRequest {
    model?: string;
    messages: OpenAIMessage[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stop?: string | string[];
}

interface OpenAIResponse {
    id: string;
    object: "chat.completion" | "chat.completion.chunk";
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message?: {
            role: string;
            content: string;
        };
        delta?: {
            role?: string;
            content?: string;
        };
        finish_reason: string | null;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// Apply model aliasing middleware to all routes
// This converts fake OpenAI/Anthropic names to real Ollama models
openaiRouter.use(modelAliasMiddleware);
openaiRouter.use(restoreModelNameMiddleware);

/**
 * OpenAI-compatible chat completions endpoint
 * POST /v1/chat/completions
 */
openaiRouter.post("/completions", async (req: Request, res: Response) => {
    try {
        const {
            model,
            messages,
            temperature = 0.7,
            max_tokens = 2000,
            stream = false,
            top_p = 1.0,
        } = req.body as OpenAIRequest;

        // Validate messages
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: {
                    message: "messages is required and must be a non-empty array",
                    type: "invalid_request_error",
                    param: "messages",
                    code: "invalid_messages",
                },
            });
        }

        // Extract system prompt and user prompt
        const systemMessages = messages.filter((m) => m.role === "system");
        const userMessages = messages.filter((m) => m.role === "user");
        const assistantMessages = messages.filter((m) => m.role === "assistant");

        let systemPrompt = systemMessages.map((m) => m.content).join("\n");
        if (!systemPrompt) {
            systemPrompt =
                "You are a helpful AI assistant. Provide clear, accurate, and concise responses.";
        }

        // Build conversation context
        let conversationContext = "";
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (msg.role === "user") {
                conversationContext += `User: ${msg.content}\n`;
            } else if (msg.role === "assistant") {
                conversationContext += `Assistant: ${msg.content}\n`;
            }
        }

        // Get last user message as the prompt
        const lastUserMessage = userMessages[userMessages.length - 1];
        if (!lastUserMessage) {
            return res.status(400).json({
                error: {
                    message: "At least one user message is required",
                    type: "invalid_request_error",
                    param: "messages",
                    code: "no_user_message",
                },
            });
        }

        const userPrompt = conversationContext || lastUserMessage.content;

        // Get available models
        const availableModels = db.getAvailableModels();

        // Resolve model alias (already done by middleware, but ensure it's resolved)
        let selectedModel = resolveModelAlias(model);

        // If no model specified, use default
        if (!selectedModel) {
            selectedModel =
                availableModels.length > 0 ? availableModels[0].model_id : "qwen2.5-coder:0.5b";
        }

        // Validate model exists, if not use default
        const modelExists = availableModels.some((m) => m.model_id === selectedModel);
        if (!modelExists && availableModels.length > 0) {
            logger.warn(`Model ${selectedModel} not found, using default`);
            selectedModel = availableModels[0].model_id;
        }

        const requestId = `chatcmpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const created = Math.floor(Date.now() / 1000);

        logger.info("OpenAI-compatible request", {
            model: selectedModel,
            messages: messages.length,
            stream,
            temperature,
            requestId,
        });

        // Handle streaming
        if (stream) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.flushHeaders();

            let fullResponse = "";
            let tokenCount = 0;

            try {
                // Send initial chunk
                const initialChunk: OpenAIResponse = {
                    id: requestId,
                    object: "chat.completion.chunk",
                    created,
                    model: selectedModel,
                    choices: [
                        {
                            index: 0,
                            delta: { role: "assistant", content: "" },
                            finish_reason: null,
                        },
                    ],
                };
                res.write(`data: ${JSON.stringify(initialChunk)}\n\n`);

                // Stream from LLM
                for await (const chunk of llmService.streamChat(
                    systemPrompt,
                    userPrompt,
                    selectedModel,
                )) {
                    fullResponse += chunk;
                    tokenCount++;

                    const streamChunk: OpenAIResponse = {
                        id: requestId,
                        object: "chat.completion.chunk",
                        created,
                        model: selectedModel,
                        choices: [
                            {
                                index: 0,
                                delta: { content: chunk },
                                finish_reason: null,
                            },
                        ],
                    };

                    res.write(`data: ${JSON.stringify(streamChunk)}\n\n`);
                }

                // Send final chunk
                const finalChunk: OpenAIResponse = {
                    id: requestId,
                    object: "chat.completion.chunk",
                    created,
                    model: selectedModel,
                    choices: [
                        {
                            index: 0,
                            delta: {},
                            finish_reason: "stop",
                        },
                    ],
                };
                res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
                res.write("data: [DONE]\n\n");
                res.end();

                logger.info("OpenAI streaming completed", {
                    requestId,
                    tokens: tokenCount,
                    responseLength: fullResponse.length,
                });
            } catch (error) {
                logger.error("OpenAI streaming error:", error);
                const errorChunk = {
                    error: {
                        message: error instanceof Error ? error.message : "Streaming failed",
                        type: "server_error",
                        code: "streaming_error",
                    },
                };
                res.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
                res.end();
            }
        } else {
            // Non-streaming response
            try {
                const response = await llmService.chat(systemPrompt, userPrompt, selectedModel);

                // Estimate token counts (rough approximation)
                const promptTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
                const completionTokens = Math.ceil(response.length / 4);

                const openaiResponse: OpenAIResponse = {
                    id: requestId,
                    object: "chat.completion",
                    created,
                    model: selectedModel,
                    choices: [
                        {
                            index: 0,
                            message: {
                                role: "assistant",
                                content: response,
                            },
                            finish_reason: "stop",
                        },
                    ],
                    usage: {
                        prompt_tokens: promptTokens,
                        completion_tokens: completionTokens,
                        total_tokens: promptTokens + completionTokens,
                    },
                };

                logger.info("OpenAI request completed", {
                    requestId,
                    model: selectedModel,
                    tokens: openaiResponse.usage?.total_tokens,
                });

                res.json(openaiResponse);
            } catch (error) {
                logger.error("OpenAI request error:", error);
                res.status(500).json({
                    error: {
                        message: error instanceof Error ? error.message : "Internal server error",
                        type: "server_error",
                        code: "internal_error",
                    },
                });
            }
        }
    } catch (error) {
        logger.error("OpenAI endpoint error:", error);
        res.status(500).json({
            error: {
                message: error instanceof Error ? error.message : "Internal server error",
                type: "server_error",
                code: "internal_error",
            },
        });
    }
});

/**
 * OpenAI-compatible models list endpoint
 * GET /v1/models
 * Returns both fake OpenAI/Anthropic names and real Ollama models
 */
openaiRouter.get("/models", async (req: Request, res: Response) => {
    try {
        // Get real Ollama models
        const realModels = db.getAvailableModels();

        // Get fake model names
        const fakeModels = getSupportedModels();

        // Combine both - fake models first, then real models
        const allModels = [
            ...fakeModels.map((model) => ({
                id: model.id,
                object: "model",
                created: Math.floor(Date.now() / 1000),
                owned_by: model.provider,
                permission: [],
                root: model.id,
                parent: null,
            })),
            ...realModels.map((model) => ({
                id: model.model_id,
                object: "model",
                created: Math.floor(new Date(model.created_at).getTime() / 1000),
                owned_by: model.provider,
                permission: [],
                root: model.model_id,
                parent: null,
            })),
        ];

        res.json({
            object: "list",
            data: allModels,
        });
    } catch (error) {
        logger.error("OpenAI models endpoint error:", error);
        res.status(500).json({
            error: {
                message: "Failed to fetch models",
                type: "server_error",
                code: "models_error",
            },
        });
    }
});

/**
 * Health check for OpenAI compatibility
 * GET /v1/chat
 */
openaiRouter.get("/", (req: Request, res: Response) => {
    res.json({
        status: "ok",
        message: "OpenAI-compatible API endpoint",
        endpoints: {
            completions: "POST /v1/chat/completions",
            models: "GET /v1/models",
        },
        compatibility: "OpenAI API v1",
        server: "ZombieCoder Backend",
    });
});

export { openaiRouter };
