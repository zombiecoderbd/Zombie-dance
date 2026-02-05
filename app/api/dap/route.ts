import { type NextRequest, NextResponse } from "next/server"
import { DebugAdapter } from "@/lib/dap/debugger"

const debugAdapter = new DebugAdapter()

export async function POST(request: NextRequest) {
  try {
    const { method, params, sessionId } = await request.json()

    switch (method) {
      case "launch":
        return NextResponse.json(await debugAdapter.launch(params))

      case "setBreakpoints":
        const breakpoints = await debugAdapter.setBreakpoints(sessionId, params.source.path, params.lines)
        return NextResponse.json({ breakpoints })

      case "stackTrace":
        const stackTrace = await debugAdapter.getStackTrace(sessionId, params.threadId)
        return NextResponse.json({ stackFrames: stackTrace })

      case "scopes":
        const scopes = await debugAdapter.getScopes(sessionId, params.frameId)
        return NextResponse.json({ scopes })

      case "variables":
        const variables = await debugAdapter.getVariables(sessionId, params.variablesReference)
        return NextResponse.json({ variables })

      case "pause":
        await debugAdapter.pause(sessionId, params.threadId)
        return NextResponse.json({ ok: true })

      case "continue":
        await debugAdapter.continue(sessionId, params.threadId)
        return NextResponse.json({ allThreadsContinued: true })

      case "next":
        await debugAdapter.next(sessionId, params.threadId)
        return NextResponse.json({ ok: true })

      case "stepIn":
        await debugAdapter.stepIn(sessionId, params.threadId)
        return NextResponse.json({ ok: true })

      case "stepOut":
        await debugAdapter.stepOut(sessionId, params.threadId)
        return NextResponse.json({ ok: true })

      case "terminate":
        await debugAdapter.terminate(sessionId)
        return NextResponse.json({ ok: true })

      default:
        return NextResponse.json({ error: "Unknown method" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] DAP Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
