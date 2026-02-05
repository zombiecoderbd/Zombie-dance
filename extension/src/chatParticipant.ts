import type * as vscode from "vscode"
import { AIClient } from "./services/aiClient"
import type { ContextManager } from "./services/contextManager"
import type { DiffManager } from "./services/diffManager"

export class ZombieChatParticipant {
  private aiClient: AIClient

  constructor(
    private context: vscode.ExtensionContext,
    private contextManager: ContextManager,
    private diffManager: DiffManager,
  ) {
    this.aiClient = new AIClient(context)
  }

  async handler(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
  ): Promise<vscode.ChatResult> {
    try {
      // Show thinking indicator
      stream.progress("Analyzing your request...")

      // Extract workspace context
      const workspaceContext = await this.contextManager.extractContext()

      // Build prompt from request
      let prompt = request.prompt

      // Handle slash commands
      if (request.command) {
        prompt = this.handleCommand(request.command, prompt)
      }

      // Stream response from AI
      let fullResponse = ""
      let hasError = false

      try {
        for await (const response of this.aiClient.streamChat(prompt, workspaceContext, token)) {
          if (token.isCancellationRequested) {
            break
          }

          switch (response.type) {
            case "token":
              if (response.content) {
                stream.markdown(response.content)
                fullResponse += response.content
              }
              break

            case "diff":
              if (response.diff) {
                // Store diff proposal
                this.diffManager.storeDiff({
                  id: response.diff.id,
                  filePath: response.diff.filePath,
                  patch: response.diff.patch,
                  description: response.diff.description,
                  timestamp: Date.now(),
                  applied: false,
                })

                // Show diff in chat with action buttons
                stream.markdown(`\n\n---\n\n**Proposed changes to \`${response.diff.filePath}\`**\n\n`)

                if (response.diff.description) {
                  stream.markdown(`${response.diff.description}\n\n`)
                }

                // Add action buttons
                stream.button({
                  command: "zombie.applyDiff",
                  title: "Apply Changes",
                  arguments: [response.diff.id],
                })

                stream.button({
                  command: "zombie.discardDiff",
                  title: "Discard",
                  arguments: [response.diff.id],
                })

                stream.markdown("\n\n")
              }
              break

            case "error":
              hasError = true
              stream.markdown(`\n\n**Error:** ${response.error}\n\n`)
              break

            case "done":
              // Stream completed
              break
          }
        }
      } catch (error) {
        hasError = true
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
        stream.markdown(`\n\n**Error:** ${errorMessage}\n\n`)

        // Check if it's a connection error
        if (errorMessage.includes("connection") || errorMessage.includes("ECONNREFUSED")) {
          stream.markdown(
            "\n**Troubleshooting:**\n" +
              "1. Make sure the backend server is running on the configured endpoint\n" +
              "2. Check your API key configuration\n" +
              "3. Verify network connectivity\n\n" +
              "Run `curl http://localhost:8001/v1/health` to test the connection.\n",
          )
        }
      }

      return {
        metadata: {
          command: request.command,
          fullResponse,
        },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      stream.markdown(`**Error:** ${errorMessage}`)

      return {
        errorDetails: {
          message: errorMessage,
        },
      }
    }
  }

  private handleCommand(command: string, prompt: string): string {
    switch (command) {
      case "explain":
        return `Explain the following code in detail:\n\n${prompt}`

      case "refactor":
        return `Refactor the following code to improve its quality, readability, and performance:\n\n${prompt}`

      case "fix":
        return `Analyze and fix any bugs or issues in the following code:\n\n${prompt}`

      case "optimize":
        return `Optimize the following code for better performance:\n\n${prompt}`

      default:
        return prompt
    }
  }
}
