import { describe, it, expect } from "vitest"
import { CodeAnalyzer } from "@/lib/lsp/analyzer"

describe("LSP Protocol", () => {
  const analyzer = new CodeAnalyzer()

  it("should extract class symbols from code", () => {
    const code = `
      export class UserService {
        getUser() { }
      }
    `
    const { symbols } = analyzer.analyzeFile("test.ts", code)
    expect(symbols).toHaveLength(1)
    expect(symbols[0].name).toBe("UserService")
  })

  it("should detect unused variables", () => {
    const code = `
      const unusedVar = 123;
      console.log('hello');
    `
    const { diagnostics } = analyzer.analyzeFile("test.ts", code)
    expect(diagnostics.length).toBeGreaterThan(0)
  })

  it("should provide code completions", () => {
    const code = "const x = "
    analyzer.analyzeFile("test.ts", code)
    const completions = analyzer.getCompletions("test.ts", 0, 10)
    expect(completions.length).toBeGreaterThan(0)
  })

  it("should provide hover information", () => {
    const code = "const myVariable = 42;"
    analyzer.analyzeFile("test.ts", code)
    const hover = analyzer.getHoverInfo("test.ts", 0, 10)
    expect(hover).not.toBeNull()
    expect(hover?.contents).toBeDefined()
  })
})
