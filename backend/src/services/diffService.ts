import { createPatch } from "diff"
import { randomUUID } from "crypto"
import { logger } from "../utils/logger.js"
import type { ChatContext } from "../types/index.js"

interface DiffProposal {
  id: string
  filePath: string
  patch: string
  description?: string
}

export class DiffService {
  extractDiffs(response: string, context: ChatContext): DiffProposal[] {
    const diffs: DiffProposal[] = []

    // Pattern to match code blocks with file paths
    // Example: ```typescript file="src/app.ts"
    const codeBlockPattern = /```(\w+)?\s+file="([^"]+)"\s*\n([\s\S]*?)```/g

    let match
    while ((match = codeBlockPattern.exec(response)) !== null) {
      const [, language, filePath, newContent] = match

      // Get original content if available
      let originalContent = ""
      if (context.activeFile && context.activeFile.path === filePath) {
        originalContent = context.activeFile.content
      }

      // Generate unified diff
      const patch = createPatch(filePath, originalContent, newContent.trim(), "original", "modified")

      const diff: DiffProposal = {
        id: randomUUID(),
        filePath,
        patch,
        description: `Update ${filePath}`,
      }

      diffs.push(diff)
      logger.info("Extracted diff", { filePath, diffId: diff.id })
    }

    return diffs
  }

  validatePatch(patch: string): boolean {
    try {
      // Basic validation: check if it starts with diff header
      return patch.startsWith("Index:") || patch.startsWith("---") || patch.startsWith("diff")
    } catch (error) {
      logger.error("Patch validation error:", error)
      return false
    }
  }
}
