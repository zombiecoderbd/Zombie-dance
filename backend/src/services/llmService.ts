import OpenAI from "openai";
import { logger } from "../utils/logger.js";
import type { LLMMessage } from "../types/index.js";

export class LLMService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      logger.warn(
        "OPENAI_API_KEY not configured - OpenAI models will not be available",
      );
    }
  }

  async *streamChat(
    systemPrompt: string,
    userPrompt: string,
    model?: string,
  ): AsyncGenerator<string> {
    const modelName = model || process.env.LLM_MODEL || "qwen2.5:0.5b";

    // Check if this is an Ollama model
    if (modelName.includes(":") || modelName.startsWith("ollama/")) {
      yield* this.streamOllamaChat(systemPrompt, userPrompt, modelName);
      return;
    }

    // Check if OpenAI API key is available
    if (!this.openai || !process.env.OPENAI_API_KEY) {
      throw new Error(
        "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable or use Ollama models.",
      );
    }

    logger.info("Starting LLM stream", { model: modelName });

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    try {
      const stream = await this.openai.chat.completions.create({
        model: modelName,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      logger.error("LLM streaming error:", error);
      throw new Error(
        `LLM service error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async chat(
    systemPrompt: string,
    userPrompt: string,
    model?: string,
  ): Promise<string> {
    const modelName = model || process.env.LLM_MODEL || "qwen2.5:0.5b";

    // Check if this is an Ollama model
    if (modelName.includes(":") || modelName.startsWith("ollama/")) {
      return this.ollamaChat(systemPrompt, userPrompt, modelName);
    }

    // Check if OpenAI API key is available
    if (!this.openai || !process.env.OPENAI_API_KEY) {
      throw new Error(
        "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable or use Ollama models.",
      );
    }

    logger.info("Starting LLM chat", { model: modelName });

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: modelName,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      logger.error("LLM chat error:", error);
      throw new Error(
        `LLM service error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Ollama support methods
  async *streamOllamaChat(
    systemPrompt: string,
    userPrompt: string,
    model: string,
  ): AsyncGenerator<string> {
    const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
    const cleanModel = model.replace("ollama/", "");

    logger.info("Starting Ollama stream", {
      model: cleanModel,
      host: ollamaHost,
    });

    const requestBody = {
      model: cleanModel,
      prompt: `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`,
      stream: true,
    };

    logger.info("Ollama request body", {
      model: cleanModel,
      promptLength: requestBody.prompt.length,
    });

    try {
      const response = await fetch(`${ollamaHost}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      logger.info("Ollama response received", {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Ollama API error details", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body from Ollama");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let tokenCount = 0;

      logger.info("Starting to read Ollama stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          logger.info("Ollama stream completed", { tokenCount });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                tokenCount++;
                logger.info("Yielding token", {
                  tokenCount,
                  responseLength: data.response.length,
                });
                yield data.response;
              }
              if (data.done) {
                logger.info("Ollama done signal received", { tokenCount });
                return;
              }
            } catch (error) {
              logger.warn("Failed to parse Ollama response line", { line });
            }
          }
        }
      }
    } catch (error) {
      logger.error("Ollama streaming error", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `Ollama service error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async ollamaChat(
    systemPrompt: string,
    userPrompt: string,
    model: string,
  ): Promise<string> {
    const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
    const cleanModel = model.replace("ollama/", "");

    logger.info("Starting Ollama chat", {
      model: cleanModel,
      host: ollamaHost,
    });

    const requestBody = {
      model: cleanModel,
      prompt: `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`,
      stream: false,
    };

    try {
      const response = await fetch(`${ollamaHost}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data.response || "";
    } catch (error) {
      logger.error("Ollama chat error:", error);
      throw new Error(
        `Ollama service error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Check if model is available
  async checkModelAvailability(model: string): Promise<boolean> {
    if (model.includes(":") || model.startsWith("ollama/")) {
      // Check Ollama model
      try {
        const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
        const cleanModel = model.replace("ollama/", "");

        const response = await fetch(`${ollamaHost}/api/tags`, {
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json();
          const models = data.models || [];
          return models.some((m: any) => m.name === cleanModel);
        }

        return false;
      } catch (error) {
        logger.warn("Failed to check Ollama model availability:", error);
        return false;
      }
    } else {
      // Check OpenAI model (assume available if API key is set)
      return !!this.openai;
    }
  }

  // Get available models
  async getAvailableModels(): Promise<
    { name: string; provider: string; available: boolean }[]
  > {
    const models = [];

    // Add configured Ollama models
    try {
      const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
      const response = await fetch(`${ollamaHost}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        const ollamaModels = data.models || [];

        for (const model of ollamaModels) {
          models.push({
            name: model.name,
            provider: "ollama",
            available: true,
          });
        }
      }
    } catch (error) {
      logger.warn("Failed to fetch Ollama models:", error);
    }

    // Add OpenAI models if available
    if (this.openai) {
      const openAIModels = ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"];
      for (const model of openAIModels) {
        models.push({
          name: model,
          provider: "openai",
          available: true,
        });
      }
    }

    return models;
  }
}
