import * as vscode from "vscode"
import * as diff from "diff"
import type { DiffProposal } from "../types"

export class DiffManager {
  private proposals: Map<string, DiffProposal> = new Map()

  constructor(private context: vscode.ExtensionContext) {}

  storeDiff(proposal: DiffProposal): void {
    this.proposals.set(proposal.id, proposal)
    console.log(`[v0] Stored diff proposal: ${proposal.id} for ${proposal.filePath}`)
  }

  async applyDiff(diffId: string): Promise<void> {
    const proposal = this.proposals.get(diffId)
    if (!proposal) {
      vscode.window.showErrorMessage(`Diff proposal ${diffId} not found`)
      return
    }

    if (proposal.applied) {
      vscode.window.showInformationMessage("This diff has already been applied")
      return
    }

    try {
      // Find the file
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error("No workspace folder open")
      }

      const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, proposal.filePath)

      // Read current content
      let document: vscode.TextDocument
      try {
        document = await vscode.workspace.openTextDocument(filePath)
      } catch (error) {
        throw new Error(`Failed to open file: ${proposal.filePath}`)
      }

      const currentContent = document.getText()

      // Apply patch
      const patches = diff.parsePatch(proposal.patch)
      if (patches.length === 0) {
        throw new Error("Invalid patch format")
      }

      const result = diff.applyPatch(currentContent, patches[0])
      if (result === false) {
        throw new Error("Failed to apply patch. File may have changed.")
      }

      // Apply changes to document
      const edit = new vscode.WorkspaceEdit()
      const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(currentContent.length))
      edit.replace(filePath, fullRange, result as string)

      const success = await vscode.workspace.applyEdit(edit)
      if (!success) {
        throw new Error("Failed to apply edit to workspace")
      }

      // Save if configured
      const config = vscode.workspace.getConfiguration("zombie")
      const autosave = config.get<boolean>("autosaveOnApply", true)
      if (autosave) {
        await document.save()
      }

      // Mark as applied
      proposal.applied = true
      this.proposals.set(diffId, proposal)

      vscode.window.showInformationMessage(`Successfully applied changes to ${proposal.filePath}`)

      // Open the file
      await vscode.window.showTextDocument(document)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      vscode.window.showErrorMessage(`Failed to apply diff: ${message}`)
      console.error("[v0] Diff application error:", error)
    }
  }

  async discardDiff(diffId: string): Promise<void> {
    const proposal = this.proposals.get(diffId)
    if (!proposal) {
      vscode.window.showWarningMessage(`Diff proposal ${diffId} not found`)
      return
    }

    this.proposals.delete(diffId)
    vscode.window.showInformationMessage(`Discarded changes for ${proposal.filePath}`)
  }

  getDiff(diffId: string): DiffProposal | undefined {
    return this.proposals.get(diffId)
  }

  getAllDiffs(): DiffProposal[] {
    return Array.from(this.proposals.values())
  }

  clearDiffs(): void {
    this.proposals.clear()
  }
}
