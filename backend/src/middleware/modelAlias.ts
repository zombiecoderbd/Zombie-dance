import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

/**
 * Model Aliasing Middleware
 * Maps fake OpenAI/Anthropic model names to real Ollama models
 * This allows editors that only support specific model names to work with our system
 */

interface ModelAlias {
    [key: string]: string;
}

// Comprehensive model mapping
// Fake OpenAI/Anthropic names -> Real Ollama models
const MODEL_ALIASES: ModelAlias = {
    // OpenAI GPT-4 family -> Qwen 2.5 Coder (best for coding)
    "gpt-4": "qwen2.5-coder:1.5b",
    "gpt-4-0613": "qwen2.5-coder:1.5b",
    "gpt-4-32k": "qwen2.5-coder:1.5b",
    "gpt-4-32k-0613": "qwen2.5-coder:1.5b",

    // OpenAI GPT-4 Turbo -> DeepSeek R1 (reasoning)
    "gpt-4-turbo": "deepseek-r1:1.5b",
    "gpt-4-turbo-preview": "deepseek-r1:1.5b",
    "gpt-4-1106-preview": "deepseek-r1:1.5b",
    "gpt-4-0125-preview": "deepseek-r1:1.5b",

    // OpenAI GPT-4o (optimized) -> Qwen 2.5 Coder
    "gpt-4o": "qwen2.5-coder:1.5b",
    "gpt-4o-2024-05-13": "qwen2.5-coder:1.5b",
    "gpt-4o-mini": "qwen2.5-coder:0.5b",
    "gpt-4o-mini-2024-07-18": "qwen2.5-coder:0.5b",

    // OpenAI GPT-3.5 family -> Qwen 2.5 Coder (fast)
    "gpt-3.5-turbo": "qwen2.5-coder:0.5b",
    "gpt-3.5-turbo-0125": "qwen2.5-coder:0.5b",
    "gpt-3.5-turbo-1106": "qwen2.5-coder:0.5b",
    "gpt-3.5-turbo-16k": "qwen2.5-coder:0.5b",

    // Anthropic Claude 3 family -> DeepSeek Coder
    "claude-3-opus-20240229": "deepseek-coder:1.3b",
    "claude-3-opus": "deepseek-coder:1.3b",
    "claude-3-sonnet-20240229": "qwen2.5-coder:1.5b",
    "claude-3-sonnet": "qwen2.5-coder:1.5b",
    "claude-3-haiku-20240307": "qwen2.5-coder:0.5b",
    "claude-3-haiku": "qwen2.5-coder:0.5b",

    // Anthropic Claude 2 family
    "claude-2.1": "qwen2.5-coder:1.5b",
    "claude-2.0": "qwen2.5-coder:1.5b",
    "claude-2": "qwen2.5-coder:1.5b",
    "claude-instant-1.2": "qwen2.5-coder:0.5b",
    "claude-instant-1": "qwen2.5-coder:0.5b",

    // Google Gemini family -> Gemma 2
    "gemini-pro": "gemma2:2b",
    "gemini-1.5-pro": "gemma2:2b",
    "gemini-1.5-flash": "gemma2:2b",
    "gemini-ultra": "gemma2:2b",

    // Mistral family
    "mistral-large": "mistral-large-3:675b-cloud",
    "mistral-medium": "qwen2.5-coder:1.5b",
    "mistral-small": "qwen2.5-coder:0.5b",

    // Generic aliases
    "default": "qwen2.5-coder:0.5b",
    "fast": "qwen2.5-coder:0.5b",
    "balanced": "qwen2.5-coder:1.5b",
    "powerful": "deepseek-coder:1.3b",
    "reasoning": "deepseek-r1:1.5b",
    "coding": "qwen2.5-coder:1.5b",
    "chat": "qwen2.5-coder:0.5b",
};

// Reverse mapping for model info requests
const REVERSE_ALIASES: { [key: string]: string[] } = {};

// Build reverse mapping
Object.entries(MODEL_ALIASES).forEach(([fake, real]) => {
    if (!REVERSE_ALIASES[real]) {
        REVERSE_ALIASES[real] = [];
    }
    REVERSE_ALIASES[real].push(fake);
});

/**
 * Get the real Ollama model name from a fake name
 */
export function resolveModelAlias(modelName: string | undefined): string {
    if (!modelName) {
        return MODEL_ALIASES["default"];
    }

    // Check if it's an alias
    if (MODEL_ALIASES[modelName.toLowerCase()]) {
        const realModel = MODEL_ALIASES[modelName.toLowerCase()];
        logger.debug("Model alias resolved", {
            requested: modelName,
            resolved: realModel,
        });
        return realModel;
    }

    // If not an alias, return as-is (might be a real Ollama model name)
    return modelName;
}

/**
 * Get all fake names for a real model
 */
export function getFakeNamesForModel(realModel: string): string[] {
    return REVERSE_ALIASES[realModel] || [];
}

/**
 * Get model mapping information
 */
export function getModelMapping() {
    return {
        aliases: MODEL_ALIASES,
        reverse: REVERSE_ALIASES,
        default: MODEL_ALIASES["default"],
    };
}

/**
 * Middleware to resolve model aliases in requests
 * Automatically converts fake OpenAI/Anthropic names to real Ollama models
 */
export function modelAliasMiddleware(req: Request, res: Response, next: NextFunction): void {
    try {
        // Check for model in body (most common)
        if (req.body && req.body.model) {
            const originalModel = req.body.model;
            const resolvedModel = resolveModelAlias(originalModel);

            if (originalModel !== resolvedModel) {
                logger.info("Model alias applied", {
                    original: originalModel,
                    resolved: resolvedModel,
                    path: req.path,
                });

                // Store original for response
                (req as any).originalModel = originalModel;
                req.body.model = resolvedModel;
            }
        }

        // Check for model in query params
        if (req.query && req.query.model) {
            const originalModel = req.query.model as string;
            const resolvedModel = resolveModelAlias(originalModel);

            if (originalModel !== resolvedModel) {
                logger.info("Model alias applied (query)", {
                    original: originalModel,
                    resolved: resolvedModel,
                });

                (req as any).originalModel = originalModel;
                req.query.model = resolvedModel;
            }
        }

        // Check for messages array with model references
        if (req.body && req.body.messages && Array.isArray(req.body.messages)) {
            req.body.messages = req.body.messages.map((msg: any) => {
                if (msg.model) {
                    msg.model = resolveModelAlias(msg.model);
                }
                return msg;
            });
        }

        next();
    } catch (error) {
        logger.error("Error in model alias middleware", error);
        // Don't fail the request, just log and continue
        next();
    }
}

/**
 * Middleware to restore original model name in responses
 * Ensures that responses use the fake name the client requested
 */
export function restoreModelNameMiddleware(req: Request, res: Response, next: NextFunction): void {
    const originalModel = (req as any).originalModel;

    if (originalModel) {
        // Intercept res.json to modify the response
        const originalJson = res.json.bind(res);

        res.json = function (body: any) {
            // Restore original model name in response
            if (body && body.model) {
                body.model = originalModel;
            }

            // Handle OpenAI-style responses with choices
            if (body && body.choices && Array.isArray(body.choices)) {
                body.choices = body.choices.map((choice: any) => {
                    if (choice.model) {
                        choice.model = originalModel;
                    }
                    return choice;
                });
            }

            return originalJson(body);
        };
    }

    next();
}

/**
 * Get list of all supported fake model names
 */
export function getSupportedModels(): Array<{
    id: string;
    name: string;
    provider: string;
    actualModel: string;
}> {
    const models = [
        // OpenAI models
        { id: "gpt-4", name: "GPT-4", provider: "openai", actualModel: MODEL_ALIASES["gpt-4"] },
        { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai", actualModel: MODEL_ALIASES["gpt-4-turbo"] },
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "openai", actualModel: MODEL_ALIASES["gpt-3.5-turbo"] },
        { id: "gpt-4o", name: "GPT-4o", provider: "openai", actualModel: MODEL_ALIASES["gpt-4o"] },
        { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", actualModel: MODEL_ALIASES["gpt-4o-mini"] },

        // Anthropic models
        { id: "claude-3-opus", name: "Claude 3 Opus", provider: "anthropic", actualModel: MODEL_ALIASES["claude-3-opus"] },
        { id: "claude-3-sonnet", name: "Claude 3 Sonnet", provider: "anthropic", actualModel: MODEL_ALIASES["claude-3-sonnet"] },
        { id: "claude-3-haiku", name: "Claude 3 Haiku", provider: "anthropic", actualModel: MODEL_ALIASES["claude-3-haiku"] },

        // Google models
        { id: "gemini-pro", name: "Gemini Pro", provider: "google", actualModel: MODEL_ALIASES["gemini-pro"] },
        { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "google", actualModel: MODEL_ALIASES["gemini-1.5-pro"] },
    ];

    return models;
}

export default {
    middleware: modelAliasMiddleware,
    restore: restoreModelNameMiddleware,
    resolve: resolveModelAlias,
    getMapping: getModelMapping,
    getSupportedModels,
    getFakeNames: getFakeNamesForModel,
};
