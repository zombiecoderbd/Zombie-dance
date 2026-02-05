import { type NextRequest, NextResponse } from "next/server"
import { MemoryCache, DiskCache, ReverseProxyCache } from "@/lib/cache/cacheManager"

const memoryCache = new MemoryCache()
const diskCache = new DiskCache()
const proxyCache = new ReverseProxyCache()

export async function POST(request: NextRequest) {
  try {
    const { action, params } = await request.json()

    switch (action) {
      case "set":
        if (params.level === "memory") {
          memoryCache.set(params.key, params.value, params.ttl)
        } else if (params.level === "disk") {
          diskCache.set(params.key, params.value, params.ttl)
        }
        return NextResponse.json({ success: true })

      case "get":
        let value = memoryCache.get(params.key)
        if (!value && params.level === "disk") {
          value = diskCache.get(params.key)
          if (value) memoryCache.set(params.key, value, params.ttl)
        }
        return NextResponse.json({ value })

      case "delete":
        memoryCache.delete(params.key)
        diskCache.delete(params.key)
        return NextResponse.json({ success: true })

      case "stats":
        return NextResponse.json(memoryCache.getStats())

      case "invalidateProxy":
        const count = proxyCache.invalidate(params.pattern)
        return NextResponse.json({ invalidated: count })

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Cache API Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
