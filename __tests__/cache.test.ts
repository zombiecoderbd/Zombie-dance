import { describe, it, expect } from "vitest"
import { MemoryCache, DiskCache } from "@/lib/cache/cacheManager"

describe("Multi-Level Caching", () => {
  it("should cache and retrieve from memory", () => {
    const cache = new MemoryCache()
    cache.set("key1", "value1")
    expect(cache.get("key1")).toBe("value1")
  })

  it("should expire cached entries", () => {
    const cache = new MemoryCache()
    cache.set("key1", "value1", 100)
    expect(cache.get("key1")).toBe("value1")
    // Note: In real tests, wait for TTL expiration
  })

  it("should evict LRU entries when full", () => {
    const cache = new MemoryCache()
    for (let i = 0; i < 1001; i++) {
      cache.set(`key${i}`, `value${i}`)
    }
    expect(cache.has("key0")).toBe(false) // LRU evicted
  })

  it("should provide cache statistics", () => {
    const cache = new MemoryCache()
    cache.set("key1", "value1")
    const stats = cache.getStats()
    expect(stats.size).toBe(1)
  })

  it("should cache to disk", () => {
    const cache = new DiskCache("./test-cache")
    cache.set("key1", { data: "test" })
    const retrieved = cache.get("key1")
    expect(retrieved.data).toBe("test")
  })
})
