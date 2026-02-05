import { describe, it, expect } from "vitest"
import { QueryOptimizer } from "@/lib/db/queryOptimizer"

describe("Database Query Optimization", () => {
  const optimizer = new QueryOptimizer()

  it("should cache query results", () => {
    const query = "SELECT * FROM users WHERE id = ?"
    const params = [1]
    const result = { id: 1, name: "Test" }

    optimizer.cacheQuery(query, params, result)
    const cached = optimizer.getCachedQuery(query, params)
    expect(cached).toEqual(result)
  })

  it("should track execution statistics", () => {
    const query = "SELECT * FROM users"
    optimizer.recordExecution(query, 100)
    optimizer.recordExecution(query, 150)

    const slow = optimizer.getSlowQueries(50)
    expect(slow.some((q) => q.query.includes("users"))).toBe(true)
  })

  it("should suggest indexes for slow queries", () => {
    const slowQuery = "SELECT * FROM users WHERE email = ? AND name = ?"
    for (let i = 0; i < 15; i++) {
      optimizer.recordExecution(slowQuery, 600)
    }

    const suggestions = optimizer.suggestIndexes()
    expect(suggestions.length).toBeGreaterThan(0)
  })
})
