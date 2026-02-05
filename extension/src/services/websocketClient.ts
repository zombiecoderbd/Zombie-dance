import type { ChatContext, StreamResponse } from "../types"

export class WebSocketClient {
  private ws: WebSocket | null = null
  private endpoint: string
  private apiKey: string

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint.replace(/^http/, "ws")
    this.apiKey = apiKey
  }

  async *streamChat(prompt: string, context: ChatContext, signal?: AbortSignal): AsyncGenerator<StreamResponse> {
    const wsUrl = `${this.endpoint}/v1/chat/ws`

    return new Promise<AsyncGenerator<StreamResponse>>((resolve, reject) => {
      this.ws = new WebSocket(wsUrl)

      const queue: StreamResponse[] = []
      let resolveNext: ((value: IteratorResult<StreamResponse>) => void) | null = null
      let done = false
      let error: Error | null = null

      this.ws.onopen = () => {
        // Send authentication and request
        this.ws?.send(
          JSON.stringify({
            type: "auth",
            apiKey: this.apiKey,
          }),
        )

        this.ws?.send(
          JSON.stringify({
            type: "chat",
            prompt,
            context,
          }),
        )

        // Return the async generator
        resolve(this.createGenerator())
      }

      this.ws.onmessage = (event) => {
        try {
          const response: StreamResponse = JSON.parse(event.data)

          if (resolveNext) {
            resolveNext({ value: response, done: false })
            resolveNext = null
          } else {
            queue.push(response)
          }

          if (response.type === "done") {
            done = true
            this.ws?.close()
          }
        } catch (err) {
          console.error("[v0] Failed to parse WebSocket message:", err)
        }
      }

      this.ws.onerror = (err) => {
        error = new Error("WebSocket connection error")
        done = true
        this.ws?.close()

        if (resolveNext) {
          reject(error)
          resolveNext = null
        }
      }

      this.ws.onclose = () => {
        done = true
        if (resolveNext) {
          resolveNext({ value: undefined, done: true })
          resolveNext = null
        }
      }

      // Handle abort signal
      signal?.addEventListener("abort", () => {
        done = true
        this.ws?.close()

        if (resolveNext) {
          resolveNext({ value: undefined, done: true })
          resolveNext = null
        }
      })

      const createGenerator = async function* (this: WebSocketClient): AsyncGenerator<StreamResponse> {
        while (!done || queue.length > 0) {
          if (error) {
            throw error
          }

          if (queue.length > 0) {
            yield queue.shift()!
          } else if (!done) {
            await new Promise<void>((resolve) => {
              resolveNext = (result) => {
                if (!result.done && result.value) {
                  resolve()
                }
              }
            })
          }
        }
      }.bind(this)

      this.createGenerator = createGenerator
    })
  }

  private createGenerator: () => AsyncGenerator<StreamResponse> = async function* () {
    // Placeholder, will be replaced in streamChat
  }

  close(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
