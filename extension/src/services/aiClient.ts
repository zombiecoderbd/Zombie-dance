import * as vscode from "vscode";
import type { ChatContext, StreamResponse } from "../types";

export class AIClient {
    private endpoint: string;
    private apiKey: string | null = null;
    private model: string;
    private sessionId: string;

    constructor(private context: vscode.ExtensionContext) {
        const config = vscode.workspace.getConfiguration("zombie");
        this.endpoint = config.get<string>("endpoint", "http://localhost:8001");
        this.model = config.get<string>("model", "qwen2.5:0.5b");

        // Generate unique session ID for this extension instance
        this.sessionId = `vscode-${vscode.env.sessionId}-${Date.now()}`;
    }

    async initialize(): Promise<void> {
        try {
            this.apiKey = await this.context.secrets.get("zombie.apiKey");

            // Test backend connection
            const isConnected = await this.testConnection();
            if (!isConnected) {
                vscode.window.showWarningMessage(
                    "ZombieCoder backend not reachable. Please ensure server is running on " +
                        this.endpoint,
                );
            }
        } catch (error) {
            console.error("[ZombieCoder] Initialization failed:", error);
            throw error;
        }
    }

    async *streamChat(
        prompt: string,
        context: ChatContext,
        signal?: AbortSignal,
    ): AsyncGenerator<StreamResponse> {
        try {
            await this.ensureInitialized();

            // Build VS Code compatible headers
            const headers = this.buildHeaders();

            // Prepare request payload
            const payload = {
                prompt,
                context: {
                    ...context,
                    vscode: {
                        version: vscode.version,
                        sessionId: this.sessionId,
                        workspaceRoot: vscode.workspace.rootPath,
                        activeFile: this.getActiveFileContext(),
                        selection: this.getSelectionContext(),
                    },
                },
                model: this.model,
                stream: true,
            };

            console.log("[ZombieCoder] Streaming request:", {
                endpoint: `${this.endpoint}/v1/chat/stream`,
                headers: Object.keys(headers),
                model: this.model,
            });

            // Make streaming request
            const response = await fetch(`${this.endpoint}/v1/chat/stream`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
                signal,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Backend error (${response.status}): ${errorText}`);
            }

            if (!response.body) {
                throw new Error("No response body received");
            }

            // Handle streaming response
            yield* this.handleStreamingResponse(response.body, signal);
        } catch (error) {
            console.error("[ZombieCoder] Stream error:", error);

            // Provide helpful error information
            if (error instanceof Error) {
                if (error.message.includes("fetch")) {
                    yield {
                        type: "error",
                        error: `Connection failed: ${this.endpoint} is not reachable. Please check if the backend server is running.`,
                    };
                } else {
                    yield {
                        type: "error",
                        error: error.message,
                    };
                }
            } else {
                yield {
                    type: "error",
                    error: "Unknown error occurred",
                };
            }
        }
    }

    private async *handleStreamingResponse(
        body: ReadableStream<Uint8Array>,
        signal?: AbortSignal,
    ): AsyncGenerator<StreamResponse> {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
            while (true) {
                if (signal?.aborted) {
                    break;
                }

                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");

                // Keep the last incomplete line in buffer
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim() === "") continue;

                    if (line.startsWith("data: ")) {
                        const data = line.slice(6).trim();
                        if (data === "[DONE]") {
                            yield { type: "done" };
                            return;
                        }

                        try {
                            const parsed: StreamResponse = JSON.parse(data);
                            yield parsed;
                        } catch (e) {
                            console.warn("[ZombieCoder] Failed to parse SSE data:", data);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    private buildHeaders(): HeadersInit {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
            "User-Agent": "vscode-extension-zombiecoder/2.0.0",
            "X-VS-Code-Version": vscode.version,
            "X-Extension-Version": this.context.extension.packageJSON.version,
            "X-Session-ID": this.sessionId,
        };

        // Add workspace context headers
        if (vscode.workspace.rootPath) {
            headers["X-Workspace-Root"] = vscode.workspace.rootPath;
        }

        // Add authentication if available
        if (this.apiKey) {
            headers["Authorization"] = `Bearer ${this.apiKey}`;
        }

        // Add VS Code specific headers for Microsoft compliance
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            headers["X-Active-Language"] = activeEditor.document.languageId;
            headers["X-File-Path"] = vscode.workspace.asRelativePath(activeEditor.document.uri);
        }

        return headers;
    }

    private getActiveFileContext() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return null;

        return {
            path: vscode.workspace.asRelativePath(activeEditor.document.uri),
            language: activeEditor.document.languageId,
            selection: activeEditor.selection
                ? {
                      start: {
                          line: activeEditor.selection.start.line,
                          character: activeEditor.selection.start.character,
                      },
                      end: {
                          line: activeEditor.selection.end.line,
                          character: activeEditor.selection.end.character,
                      },
                      text: activeEditor.document.getText(activeEditor.selection),
                  }
                : null,
        };
    }

    private getSelectionContext() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || activeEditor.selection.isEmpty) return null;

        const selection = activeEditor.selection;
        const selectedText = activeEditor.document.getText(selection);

        return {
            text: selectedText,
            startLine: selection.start.line,
            endLine: selection.end.line,
            language: activeEditor.document.languageId,
        };
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.endpoint}/v1/health`, {
                method: "GET",
                headers: {
                    "User-Agent": "vscode-extension-zombiecoder/2.0.0",
                    "X-VS-Code-Version": vscode.version,
                    "X-Session-ID": this.sessionId,
                },
                signal: AbortSignal.timeout(5000),
            });

            const result = response.ok;
            console.log(
                "[ZombieCoder] Connection test:",
                result ? "SUCCESS" : `FAILED (${response.status})`,
            );

            if (result) {
                const data = await response.json();
                console.log("[ZombieCoder] Backend info:", data);
            }

            return result;
        } catch (error) {
            console.error("[ZombieCoder] Connection test failed:", error);
            return false;
        }
    }

    async getAvailableModels(): Promise<any[]> {
        try {
            await this.ensureInitialized();

            const response = await fetch(`${this.endpoint}/api/models`, {
                headers: this.buildHeaders(),
                signal: AbortSignal.timeout(10000),
            });

            if (response.ok) {
                const data = await response.json();
                return data.models || [];
            }

            return [];
        } catch (error) {
            console.error("[ZombieCoder] Failed to get models:", error);
            return [];
        }
    }

    async switchModel(modelName: string): Promise<boolean> {
        try {
            this.model = modelName;

            // Update VS Code configuration
            const config = vscode.workspace.getConfiguration("zombie");
            await config.update("model", modelName, vscode.ConfigurationTarget.Global);

            console.log("[ZombieCoder] Switched to model:", modelName);
            return true;
        } catch (error) {
            console.error("[ZombieCoder] Failed to switch model:", error);
            return false;
        }
    }

    private async ensureInitialized(): Promise<void> {
        if (!this.apiKey) {
            await this.initialize();
        }
    }

    // Chat method for non-streaming requests
    async chat(prompt: string, context: ChatContext): Promise<string> {
        try {
            await this.ensureInitialized();

            const payload = {
                prompt,
                context: {
                    ...context,
                    vscode: {
                        version: vscode.version,
                        sessionId: this.sessionId,
                        workspaceRoot: vscode.workspace.rootPath,
                        activeFile: this.getActiveFileContext(),
                        selection: this.getSelectionContext(),
                    },
                },
                model: this.model,
                stream: false,
            };

            const response = await fetch(`${this.endpoint}/v1/chat`, {
                method: "POST",
                headers: this.buildHeaders(),
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(30000),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Backend error (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            return data.response || "";
        } catch (error) {
            console.error("[ZombieCoder] Chat error:", error);
            throw error;
        }
    }

    dispose(): void {
        // Clean up any resources
        this.apiKey = null;
    }
}
