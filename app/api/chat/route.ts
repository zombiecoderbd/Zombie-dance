import { NextResponse } from "next/server"
import { LLMFactory } from "@/lib/llm/factory"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, context, modelId } = body

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const service = modelId ? LLMFactory.createService(modelId) : LLMFactory.getDefaultService()

    if (!service) {
      return NextResponse.json({ error: "No LLM service available. Add a provider in admin panel." }, { status: 503 })
    }

    const isConnected = await service.validateConnection()
    if (!isConnected) {
      return NextResponse.json({ error: "LLM service is not responding" }, { status: 503 })
    }

    const response = await service.generateText({
      prompt: message,
      model: "default",
      context,
    })

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    return NextResponse.json({
      text: response.text,
      model: response.model,
      usage: response.usage,
    })
  } catch (error) {
    console.error("[v0] Chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
