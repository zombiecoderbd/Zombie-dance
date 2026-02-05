export interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl: number
  hits: number
}

export class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private maxSize = 1000

  set<T>(key: string, value: T, ttl = 3600000): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    entry.hits++
    return entry.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private evictLRU(): void {
    let lruKey: string | null = null
    let minHits = Number.POSITIVE_INFINITY

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < minHits || (entry.hits === minHits && Date.now() - entry.timestamp > 0)) {
        minHits = entry.hits
        lruKey = key
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        size: JSON.stringify(entry.value).length,
        hits: entry.hits,
        age: Date.now() - entry.timestamp,
      })),
    }
  }
}

export class DiskCache {
  private cacheDir = "./cache"

  constructor(cacheDir?: string) {
    if (cacheDir) this.cacheDir = cacheDir
    this.ensureDir()
  }

  private ensureDir(): void {
    const fs = require("fs")
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  set(key: string, value: any, ttl = 86400000): void {
    const fs = require("fs")
    const path = require("path")

    const filePath = path.join(this.cacheDir, this.hashKey(key) + ".json")
    const cacheEntry = {
      value,
      timestamp: Date.now(),
      ttl,
    }

    fs.writeFileSync(filePath, JSON.stringify(cacheEntry))
  }

  get(key: string): any | null {
    const fs = require("fs")
    const path = require("path")

    const filePath = path.join(this.cacheDir, this.hashKey(key) + ".json")

    if (!fs.existsSync(filePath)) return null

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"))

      if (Date.now() - data.timestamp > data.ttl) {
        fs.unlinkSync(filePath)
        return null
      }

      return data.value
    } catch {
      return null
    }
  }

  delete(key: string): boolean {
    const fs = require("fs")
    const path = require("path")

    const filePath = path.join(this.cacheDir, this.hashKey(key) + ".json")
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
    return false
  }

  private hashKey(key: string): string {
    const crypto = require("crypto")
    return crypto.createHash("md5").update(key).digest("hex")
  }
}

export class ReverseProxyCache {
  private cache: Map<string, { body: any; headers: Record<string, string>; timestamp: number }> = new Map()

  set(url: string, response: { body: any; headers: Record<string, string> }, ttl = 300000): void {
    this.cache.set(url, {
      ...response,
      timestamp: Date.now(),
    })

    setTimeout(() => this.cache.delete(url), ttl)
  }

  get(url: string): { body: any; headers: Record<string, string> } | null {
    return this.cache.get(url) || null
  }

  invalidate(pattern: string): number {
    let count = 0
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        count++
      }
    }
    return count
  }
}
