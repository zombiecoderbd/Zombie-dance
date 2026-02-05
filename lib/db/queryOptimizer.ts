export class QueryOptimizer {
  private queryCache: Map<string, { result: any; timestamp: number }> = new Map()
  private executionStats: Map<
    string,
    {
      count: number
      totalTime: number
      avgTime: number
      lastExecuted: number
    }
  > = new Map()

  cacheQuery(query: string, params: any[], result: any, ttl = 300000): void {
    const cacheKey = this.getCacheKey(query, params)
    this.queryCache.set(cacheKey, { result, timestamp: Date.now() })

    setTimeout(() => this.queryCache.delete(cacheKey), ttl)
  }

  getCachedQuery(query: string, params: any[]): any | null {
    const cacheKey = this.getCacheKey(query, params)
    const cached = this.queryCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached.result
    }

    return null
  }

  recordExecution(query: string, executionTime: number): void {
    const normalized = this.normalizeQuery(query)
    const stats = this.executionStats.get(normalized) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      lastExecuted: 0,
    }

    stats.count++
    stats.totalTime += executionTime
    stats.avgTime = stats.totalTime / stats.count
    stats.lastExecuted = Date.now()

    this.executionStats.set(normalized, stats)
  }

  getSlowQueries(threshold = 1000): Array<{
    query: string
    avgTime: number
    count: number
  }> {
    const slow: Array<{ query: string; avgTime: number; count: number }> = []

    for (const [query, stats] of this.executionStats.entries()) {
      if (stats.avgTime > threshold) {
        slow.push({
          query,
          avgTime: stats.avgTime,
          count: stats.count,
        })
      }
    }

    return slow.sort((a, b) => b.avgTime - a.avgTime)
  }

  suggestIndexes(): Array<{ table: string; columns: string[] }> {
    const suggestions: Array<{ table: string; columns: string[] }> = []

    for (const [query, stats] of this.executionStats.entries()) {
      if (stats.count > 10 && stats.avgTime > 500) {
        const match = query.match(/FROM\s+(\w+)/i)
        const where = query.match(/WHERE\s+(.+?)(?:ORDER|GROUP|LIMIT|$)/i)

        if (match && where) {
          const columns = where[1]
            .split(/AND|OR/i)
            .map((c) => c.trim().split(/[<>=]/)[0].trim())
            .filter((c) => c)

          suggestions.push({
            table: match[1],
            columns: [...new Set(columns)],
          })
        }
      }
    }

    return suggestions
  }

  clearCache(): void {
    this.queryCache.clear()
  }

  private getCacheKey(query: string, params: any[]): string {
    const normalized = this.normalizeQuery(query)
    return `${normalized}:${JSON.stringify(params)}`
  }

  private normalizeQuery(query: string): string {
    return query.replace(/\s+/g, " ").replace(/\?/g, "$").toUpperCase().trim()
  }
}
