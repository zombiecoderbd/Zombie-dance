import type * as vscode from "vscode"
import { DashboardManager } from "../admin/dashboardManager"
import { ProviderManager } from "../admin/providerManager"
import { ExtensionManager } from "../admin/extensionManager"
import { UserManager } from "../admin/userManager"
import { MonitoringService } from "../admin/monitoringService"

export class AdminWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "zombie.adminPanel"

  private view?: vscode.WebviewView
  private updateInterval?: NodeJS.Timer
  private dashboardManager = DashboardManager.getInstance()
  private providerManager = ProviderManager.getInstance()
  private extensionManager = ExtensionManager.getInstance()
  private userManager = UserManager.getInstance()
  private monitoringService = MonitoringService.getInstance()

  constructor(private readonly context: vscode.ExtensionContext) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this.view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    }

    webviewView.webview.html = this.getWebviewContent()

    // Set up message handling
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "getDashboard":
          const metrics = this.dashboardManager.getMetrics()
          webviewView.webview.postMessage({
            command: "updateDashboard",
            data: metrics,
          })
          break

        case "getProviders":
          const providers = this.providerManager.getProviders()
          webviewView.webview.postMessage({
            command: "updateProviders",
            data: providers,
          })
          break

        case "getExtensions":
          const extensions = this.extensionManager.getExtensions()
          webviewView.webview.postMessage({
            command: "updateExtensions",
            data: extensions,
          })
          break

        case "testProvider":
          try {
            await this.providerManager.testConnection(message.providerId)
            webviewView.webview.postMessage({
              command: "providerTestResult",
              providerId: message.providerId,
              success: true,
            })
          } catch (error) {
            webviewView.webview.postMessage({
              command: "providerTestResult",
              providerId: message.providerId,
              success: false,
              error: String(error),
            })
          }
          break

        case "setDefaultProvider":
          this.providerManager.setDefaultProvider(message.providerId)
          webviewView.webview.postMessage({
            command: "notification",
            message: `Default provider changed to ${message.providerId}`,
          })
          break
      }
    })

    // Start real-time updates
    this.startRealtimeUpdates(webviewView)
  }

  private startRealtimeUpdates(webviewView: vscode.WebviewView): void {
    this.updateInterval = setInterval(() => {
      const metrics = this.dashboardManager.getMetrics()
      webviewView.webview.postMessage({
        command: "updateDashboard",
        data: metrics,
      })
    }, 2000)
  }

  private getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zombie Admin Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary: #2c3e50;
            --secondary: #3498db;
            --accent: #9b59b6;
            --success: #27ae60;
            --warning: #f39c12;
            --danger: #e74c3c;
            --bg-dark: #1a1a1a;
            --bg-light: #2d2d2d;
            --text-primary: #ffffff;
            --text-secondary: #b0b0b0;
            --border: #3a3a3a;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: var(--bg-dark);
            color: var(--text-primary);
            font-size: 13px;
            line-height: 1.6;
            overflow-y: auto;
        }

        .container {
            padding: 16px;
            max-width: 100%;
        }

        .header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid var(--border);
        }

        .header h1 {
            font-size: 20px;
            font-weight: 600;
            color: var(--text-primary);
        }

        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
        }

        .status-online {
            background: var(--success);
            box-shadow: 0 0 10px var(--success);
        }

        .status-offline {
            background: var(--danger);
        }

        .status-degraded {
            background: var(--warning);
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            margin-bottom: 24px;
        }

        .metric-card {
            background: var(--bg-light);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            transition: all 0.2s ease;
        }

        .metric-card:hover {
            background: #333333;
            border-color: var(--secondary);
        }

        .metric-label {
            font-size: 11px;
            font-weight: 500;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .metric-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--secondary);
        }

        .metric-unit {
            font-size: 12px;
            color: var(--text-secondary);
        }

        .section {
            background: var(--bg-light);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
        }

        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .provider-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: var(--bg-dark);
            border-radius: 6px;
            margin-bottom: 8px;
            border: 1px solid var(--border);
        }

        .provider-name {
            font-weight: 500;
            color: var(--text-primary);
        }

        .provider-status {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
        }

        .provider-health {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }

        .health-healthy {
            background: var(--success);
        }

        .health-unhealthy {
            background: var(--danger);
        }

        .button {
            padding: 8px 12px;
            background: var(--secondary);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .button:hover {
            background: #2980b9;
            transform: translateY(-1px);
        }

        .button:active {
            transform: translateY(0);
        }

        .button-small {
            padding: 4px 8px;
            font-size: 11px;
        }

        .activity-log {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 300px;
            overflow-y: auto;
        }

        .log-entry {
            padding: 8px;
            background: var(--bg-dark);
            border-left: 3px solid var(--secondary);
            border-radius: 4px;
            font-size: 11px;
            color: var(--text-secondary);
        }

        .log-entry.error {
            border-left-color: var(--danger);
        }

        .log-entry.warning {
            border-left-color: var(--warning);
        }

        .log-entry.success {
            border-left-color: var(--success);
        }

        .timestamp {
            font-size: 10px;
            color: var(--text-secondary);
            opacity: 0.7;
        }

        .loading {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: var(--secondary);
            border-radius: 50%;
            animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="status-indicator status-online" id="statusIndicator"></span>
            <h1>Zombie Admin Dashboard</h1>
        </div>

        <div class="metrics-grid" id="metricsGrid">
            <div class="metric-card">
                <div class="metric-label">Server Status</div>
                <div class="metric-value" id="serverStatus">--</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">System Load</div>
                <div class="metric-value" id="systemLoad">--</div>
                <div class="metric-unit">%</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Active Connections</div>
                <div class="metric-value" id="activeConnections">--</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Avg Response Time</div>
                <div class="metric-value" id="avgResponseTime">--</div>
                <div class="metric-unit">ms</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Requests/sec</div>
                <div class="metric-value" id="requestsPerSec">--</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Error Rate</div>
                <div class="metric-value" id="errorRate">--</div>
                <div class="metric-unit">%</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Provider Status</div>
            <div id="providersList"></div>
        </div>

        <div class="section">
            <div class="section-title">Recent Activity</div>
            <div class="activity-log" id="activityLog"></div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function updateDashboard(data) {
            document.getElementById('serverStatus').textContent = data.serverStatus.toUpperCase();
            document.getElementById('systemLoad').textContent = data.systemLoad;
            document.getElementById('activeConnections').textContent = data.activeConnections;
            document.getElementById('avgResponseTime').textContent = data.avgResponseTime;
            document.getElementById('requestsPerSec').textContent = data.requestsPerSecond;
            document.getElementById('errorRate').textContent = data.errorRate.toFixed(1);

            const indicator = document.getElementById('statusIndicator');
            indicator.className = \`status-indicator status-\${data.serverStatus}\`;

            // Update providers
            const providersList = document.getElementById('providersList');
            providersList.innerHTML = '';
            for (const provider of data.providersHealthy) {
                const healthClass = provider.status === 'healthy' ? 'health-healthy' : 'health-unhealthy';
                providersList.innerHTML += \`
                    <div class="provider-item">
                        <div class="provider-name">\${provider.name}</div>
                        <div class="provider-status">
                            <span class="provider-health \${healthClass}"></span>
                            <span>\${provider.status}</span>
                            <span>(\${provider.responseTime}ms)</span>
                        </div>
                    </div>
                \`;
            }

            // Update activity log
            const activityLog = document.getElementById('activityLog');
            activityLog.innerHTML = '';
            for (const activity of data.recentActivity.slice().reverse()) {
                const logClass = activity.severity === 'error' ? 'error' : activity.severity === 'warning' ? 'warning' : 'success';
                const time = new Date(activity.timestamp).toLocaleTimeString();
                activityLog.innerHTML += \`
                    <div class="log-entry \${logClass}">
                        <div>\${activity.message}</div>
                        <div class="timestamp">\${time}</div>
                    </div>
                \`;
            }
        }

        // Request initial data
        vscode.postMessage({ command: 'getDashboard' });

        // Listen for updates
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateDashboard') {
                updateDashboard(message.data);
            }
        });

        // Periodically request updates
        setInterval(() => {
            vscode.postMessage({ command: 'getDashboard' });
        }, 2000);
    </script>
</body>
</html>`
  }

  public dispose() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
  }
}
