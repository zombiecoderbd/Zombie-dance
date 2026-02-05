import * as vscode from "vscode"
import * as path from "path"

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "zombieCoder-sidebar"

  private _view?: vscode.WebviewView
  private _outputChannel: vscode.OutputChannel

  constructor(private readonly _extensionUri: vscode.Uri) {
    this._outputChannel = vscode.window.createOutputChannel("ZombieCoder - UI")
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    }

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)

    webviewView.webview.onDidReceiveMessage((data) => {
      this._handleMessage(data)
    })
  }

  private _handleMessage(data: any) {
    switch (data.type) {
      case "newChat":
        vscode.commands.executeCommand("zombieCoder.newChat")
        break
      case "clearHistory":
        vscode.commands.executeCommand("zombieCoder.clearHistory")
        break
      case "indexWorkspace":
        vscode.commands.executeCommand("zombieCoder.indexWorkspace")
        break
      case "openSettings":
        vscode.commands.executeCommand("zombieCoder.openSettings")
        break
    }
  }

  public sendMessage(message: any) {
    this._view?.webview.postMessage(message)
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const cssUri = webview.asWebviewUri(path.join(this._extensionUri, "resources", "sidebar.css"))
    const jsUri = webview.asWebviewUri(path.join(this._extensionUri, "resources", "sidebar.js"))

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZombieCoder Sidebar</title>
    <link rel="stylesheet" href="${cssUri}">
</head>
<body>
    <div class="sidebar-container">
        <!-- Header -->
        <div class="sidebar-header">
            <div class="logo">
                <div class="logo-icon">Z</div>
                <span class="logo-text">ZombieCoder</span>
            </div>
        </div>

        <!-- New Chat Button -->
        <button class="new-chat-btn" onclick="sendMessage({type: 'newChat'})">
            <i class="codicon codicon-plus"></i>
            New Chat
        </button>

        <!-- Stats Section -->
        <div class="stats-section">
            <div class="stat-item">
                <label>Index Status</label>
                <div class="stat-value" id="indexStatus">Not indexed</div>
            </div>
            <div class="stat-item">
                <label>Connections</label>
                <div class="stat-value connected" id="connectionStatus">Connected</div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
            <button class="action-btn" onclick="sendMessage({type: 'indexWorkspace'})" title="Index codebase">
                <i class="codicon codicon-file-code"></i>
                Index
            </button>
            <button class="action-btn" onclick="sendMessage({type: 'openSettings'})" title="Open Settings">
                <i class="codicon codicon-settings-gear"></i>
                Settings
            </button>
            <button class="action-btn" onclick="sendMessage({type: 'clearHistory'})" title="Clear History">
                <i class="codicon codicon-trash"></i>
                Clear
            </button>
        </div>

        <!-- Conversation History -->
        <div class="history-section">
            <div class="history-header">
                <span>Conversations</span>
            </div>
            <div class="history-list" id="historyList">
                <div class="empty-state">
                    <i class="codicon codicon-comment"></i>
                    <p>No conversations yet</p>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="sidebar-footer">
            <small>ZombieCoder v2.0</small>
            <small id="userInfo">Powered by Sahon Srabon</small>
        </div>
    </div>

    <script src="${jsUri}"></script>
</body>
</html>`
  }
}
