import * as vscode from "vscode"
import type { DanceCommand } from "../types/agents"

export interface DanceFlowOptions {
  animationSpeed?: number // milliseconds per command
  cursorAnimationDuration?: number
  highlightColor?: string
}

export class DanceFlowEngine {
  private static instance: DanceFlowEngine
  private options: Required<DanceFlowOptions>

  private constructor(options: DanceFlowOptions = {}) {
    this.options = {
      animationSpeed: options.animationSpeed || 200,
      cursorAnimationDuration: options.cursorAnimationDuration || 300,
      highlightColor: options.highlightColor || "rgba(250, 200, 0, 0.3)",
    }
  }

  static getInstance(options?: DanceFlowOptions): DanceFlowEngine {
    if (!DanceFlowEngine.instance) {
      DanceFlowEngine.instance = new DanceFlowEngine(options)
    }
    return DanceFlowEngine.instance
  }

  async playDanceSequence(commands: DanceCommand[], editor: vscode.TextEditor): Promise<void> {
    for (const command of commands) {
      await this.executeCommand(command, editor)

      // Wait between commands for visual effect
      await this.delay(this.options.animationSpeed)
    }
  }

  private async executeCommand(command: DanceCommand, editor: vscode.TextEditor): Promise<void> {
    switch (command.action) {
      case "move_cursor":
        await this.moveCursor(editor, command.line || 0, command.column || 0)
        break

      case "insert_text":
        await this.insertText(editor, command.text || "", command.line)
        break

      case "highlight":
        await this.highlightRange(editor, command.line || 0, command.endLine, command.endColumn)
        break

      case "delete_text":
        await this.deleteRange(editor, command.line || 0, command.column || 0, command.endLine, command.endColumn)
        break

      case "replace_text":
        await this.replaceText(editor, command.text || "", command.line || 0)
        break
    }
  }

  private async moveCursor(editor: vscode.TextEditor, line: number, column: number): Promise<void> {
    const position = new vscode.Position(line, column)
    const selection = new vscode.Selection(position, position)

    editor.selection = selection
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter)

    await this.delay(this.options.cursorAnimationDuration)
  }

  private async insertText(editor: vscode.TextEditor, text: string, line?: number): Promise<void> {
    const position = line ? new vscode.Position(line, 0) : editor.selection.active

    await editor.edit((editBuilder) => {
      editBuilder.insert(position, text)
    })
  }

  private async highlightRange(
    editor: vscode.TextEditor,
    startLine: number,
    endLine?: number,
    endColumn?: number,
  ): Promise<void> {
    const range = new vscode.Range(startLine, 0, endLine || startLine, endColumn || 0)

    const decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: this.options.highlightColor,
      isWholeLine: true,
    })

    editor.setDecorations(decorationType, [range])

    // Clear decoration after animation duration
    await this.delay(500)
    editor.setDecorations(decorationType, [])
    decorationType.dispose()
  }

  private async deleteRange(
    editor: vscode.TextEditor,
    startLine: number,
    startCol: number,
    endLine?: number,
    endCol?: number,
  ): Promise<void> {
    const range = new vscode.Range(startLine, startCol, endLine || startLine, endCol || startCol + 1)

    await editor.edit((editBuilder) => {
      editBuilder.delete(range)
    })
  }

  private async replaceText(editor: vscode.TextEditor, text: string, line: number): Promise<void> {
    const lineObj = editor.document.lineAt(line)
    const range = lineObj.range

    await editor.edit((editBuilder) => {
      editBuilder.replace(range, text)
    })
  }

  setAnimationSpeed(milliseconds: number): void {
    if (milliseconds > 0 && milliseconds < 2000) {
      this.options.animationSpeed = milliseconds
    }
  }

  setHighlightColor(color: string): void {
    this.options.highlightColor = color
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
