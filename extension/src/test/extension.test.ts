import * as assert from "assert"
import * as vscode from "vscode"
import { suite } from "vscode-test"

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Running extension tests")

  test("Extension should be present", () => {
    assert.ok(vscode.extensions.getExtension("zombiecoder.zombie-ai-assistant"))
  })

  test("Extension should activate", async () => {
    const ext = vscode.extensions.getExtension("zombiecoder.zombie-ai-assistant")
    await ext?.activate()
    assert.ok(ext?.isActive)
  })

  test("Commands should be registered", async () => {
    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes("zombie.openChat"))
    assert.ok(commands.includes("zombie.explainCode"))
    assert.ok(commands.includes("zombie.refactorCode"))
    assert.ok(commands.includes("zombie.applyDiff"))
    assert.ok(commands.includes("zombie.discardDiff"))
  })
})
