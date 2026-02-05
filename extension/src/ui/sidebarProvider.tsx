import * as vscode from "vscode"
import { HistoryManager } from "../history/historyManager"
import { ProjectIndexer } from "../indexing/projectIndexer"
import type { Thenable } from "vscode"

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "zombie.sidebar"
  private view?: vscode.WebviewView
  private historyManager = HistoryManager.getInstance()
  private projectIndexer = ProjectIndexer.getInstance()

  constructor(private readonly context: vscode.ExtensionContext) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken,
  ): void | Thenable<void> {
    this.view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    }

    webviewView.webview.html = this.getHtmlContent(webviewView.webview)

    webviewView.webview.onDidReceiveMessage(this.handleMessage.bind(this))
  }

  private async handleMessage(message: any) {
    switch (message.command) {
      case "newChat":
        await vscode.commands.executeCommand("zombie.newChat")
        break

      case "indexProject":
        await vscode.commands.executeCommand("zombie.indexProject")
        break

      case "showHistory":
        await vscode.commands.executeCommand("zombie.showHistory")
        break

      case "toggleTerminal":
        await vscode.commands.executeCommand("zombie.toggleTerminalPermissions")
        break

      case "getSettings":
        const config = vscode.workspace.getConfiguration("zombie")
        this.view?.webview.postMessage({
          command: "settingsData",
          data: {
            endpoint: config.get("endpoint"),
            model: config.get("model"),
            allowTerminal: config.get("allowTerminalCommands", false),
            streamTransport: config.get("streamTransport", "sse"),
          },
        })
        break
    }
  }

  private getHtmlContent(webview: vscode.Webview): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zombie AI Assistant</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            padding: 16px;
          }

          .container {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          }

          .header h2 {
            font-size: 16px;
            font-weight: 600;
          }

          .section {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .section-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--vscode-descriptionForeground);
            margin-top: 12px;
            margin-bottom: 8px;
          }

          button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            transition: background-color 0.2s;
          }

          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }

          button:active {
            opacity: 0.8;
          }

          .button-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .input-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .input-group label {
            font-size: 12px;
            font-weight: 500;
          }

          input[type="text"],
          select {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 6px 8px;
            border-radius: 4px;
            font-size: 12px;
          }

          input[type="text"]:focus,
          select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
          }

          .toggle {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background-color: var(--vscode-sideBar-background);
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
          }

          .toggle input[type="checkbox"] {
            width: 16px;
            height: 16px;
            cursor: pointer;
          }

          .info-box {
            background-color: var(--vscode-infoBox-background);
            border: 1px solid var(--vscode-infoBox-border);
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            line-height: 1.4;
          }

          .footer {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid var(--vscode-sideBar-border);
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <span style="font-size: 20px;">🧟</span>
            <h2>Zombie AI</h2>
          </div>

          <!-- Chat Section -->
          <div class="section">
            <div class="section-title">Chat</div>
            <button onclick="sendMessage('newChat')">New Chat</button>
            <button onclick="sendMessage('showHistory')">Chat History</button>
          </div>

          <!-- Project Section -->
          <div class="section">
            <div class="section-title">Project</div>
            <button onclick="sendMessage('indexProject')">Index Project (RAG)</button>
            <div class="info-box">
              Index your project to improve AI responses with local context.
            </div>
          </div>

          <!-- Settings Section -->
          <div class="section">
            <div class="section-title">Settings</div>
            
            <div class="input-group">
              <label>Model</label>
              <select id="modelSelect">
                <option>gpt-4</option>
                <option>gpt-4-turbo</option>
                <option>gpt-3.5-turbo</option>
                <option>claude-3-opus</option>
                <option>claude-3-sonnet</option>
              </select>
            </div>

            <div class="input-group">
              <label>API Endpoint</label>
              <input type="text" id="endpointInput" placeholder="http://localhost:8001">
            </div>

            <div class="toggle">
              <input type="checkbox" id="terminalToggle" onchange="sendMessage('toggleTerminal')">
              <label for="terminalToggle">Allow Terminal Commands</label>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Keyboard Shortcut: <strong>Ctrl+Shift+Z</strong></p>
            <p style="margin-top: 8px;">Local-first AI. Your privacy is protected.</p>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          function sendMessage(command) {
            vscode.postMessage({ command });
          }

          window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'settingsData') {
              document.getElementById('endpointInput').value = message.data.endpoint;
              document.getElementById('modelSelect').value = message.data.model;
              document.getElementById('terminalToggle').checked = message.data.allowTerminal;
            }
          });

          // Load settings on load
          vscode.postMessage({ command: 'getSettings' });
        </script>
      </body>
      </html>
    `
  }
}
