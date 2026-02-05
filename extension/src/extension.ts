import * as vscode from "vscode"
import { ZombieChatParticipant } from "./chatParticipant"
import { ContextManager } from "./services/contextManager"
import { DiffManager } from "./services/diffManager"
import { SafetyAgreement } from "./safety/safetyAgreement"
import { AgentRouter } from "./agents/agentRouter"
import { HistoryManager } from "./history/historyManager"
import { ProjectIndexer } from "./indexing/projectIndexer"
import { DanceFlowEngine } from "./animations/danceFlowEngine"
import { DashboardManager } from "./admin/dashboardManager"
import { ProviderManager } from "./admin/providerManager"
import { ExtensionManager } from "./admin/extensionManager"
import { MonitoringService } from "./admin/monitoringService"
import { UserManager } from "./admin/userManager"

let chatParticipant: ZombieChatParticipant
let contextManager: ContextManager
let diffManager: DiffManager
let safetyAgreement: SafetyAgreement
let agentRouter: AgentRouter
let historyManager: HistoryManager
let projectIndexer: ProjectIndexer
let danceFlowEngine: DanceFlowEngine
let dashboardManager: DashboardManager
let providerManager: ProviderManager
let extensionManager: ExtensionManager
let monitoringService: MonitoringService
let userManager: UserManager

export async function activate(context: vscode.ExtensionContext) {
  console.log("[v0] Zombie AI Assistant is now active")

  safetyAgreement = SafetyAgreement.getInstance(context)
  const agreedToSafety = await safetyAgreement.checkAndShowAgreement()

  if (!agreedToSafety) {
    console.log("[v0] User declined safety agreement - extension will not activate")
    return
  }

  contextManager = new ContextManager()
  diffManager = new DiffManager(context)
  agentRouter = AgentRouter.getInstance()
  historyManager = HistoryManager.getInstance()
  projectIndexer = ProjectIndexer.getInstance()
  danceFlowEngine = DanceFlowEngine.getInstance()

  dashboardManager = DashboardManager.getInstance()
  providerManager = ProviderManager.getInstance()
  extensionManager = ExtensionManager.getInstance()
  monitoringService = MonitoringService.getInstance()
  userManager = UserManager.getInstance()

  // Initialize with Ollama as default
  await providerManager.initialize(context)
  await dashboardManager.initialize()
  await extensionManager.initialize()

  // Register chat participant
  chatParticipant = new ZombieChatParticipant(context, contextManager, diffManager)
  const participant = vscode.chat.createChatParticipant(
    "zombie.assistant",
    chatParticipant.handler.bind(chatParticipant),
  )
  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, "resources", "icon.png")
  context.subscriptions.push(participant)

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("zombie.openChat", async () => {
      await vscode.commands.executeCommand("workbench.action.chat.open", { query: "@zombie" })
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("zombie.explainCode", async () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) {
        vscode.window.showWarningMessage("No active editor found")
        return
      }

      const selection = editor.document.getText(editor.selection)
      if (!selection) {
        vscode.window.showWarningMessage("No code selected")
        return
      }

      await vscode.commands.executeCommand("workbench.action.chat.open", {
        query: `@zombie Explain this code:\n\n\`\`\`${editor.document.languageId}\n${selection}\n\`\`\``,
      })
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("zombie.refactorCode", async () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) {
        vscode.window.showWarningMessage("No active editor found")
        return
      }

      const selection = editor.document.getText(editor.selection)
      if (!selection) {
        vscode.window.showWarningMessage("No code selected")
        return
      }

      await vscode.commands.executeCommand("workbench.action.chat.open", {
        query: `@zombie /refactor Improve this code:\n\n\`\`\`${editor.document.languageId}\n${selection}\n\`\`\``,
      })
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("zombie.applyDiff", async (diffId: string) => {
      await diffManager.applyDiff(diffId)
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("zombie.discardDiff", async (diffId: string) => {
      await diffManager.discardDiff(diffId)
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("zombie.newChat", async () => {
      const history = await historyManager.createHistory()
      await vscode.commands.executeCommand("workbench.action.chat.open", { query: "@zombie" })
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("zombie.indexProject", async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders) {
        vscode.window.showWarningMessage("No workspace folder open")
        return
      }

      vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: "Indexing project..." },
        async () => {
          try {
            await projectIndexer.indexProject(workspaceFolders[0].uri.fsPath)
            vscode.window.showInformationMessage("Project indexed successfully!")
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to index project: ${error}`)
          }
        },
      )
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("zombie.showHistory", async () => {
      const histories = await historyManager.getAllHistories()
      if (histories.length === 0) {
        vscode.window.showInformationMessage("No chat history available")
        return
      }

      const items = histories.map((h) => ({
        label: h.title,
        description: new Date(h.updatedAt).toLocaleString(),
        history: h,
      }))

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "Select a chat history",
      })

      if (selected) {
        await vscode.commands.executeCommand("workbench.action.chat.open", {
          query: `@zombie History: ${selected.label}`,
        })
      }
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("zombie.toggleTerminalPermissions", async () => {
      const config = vscode.workspace.getConfiguration("zombie")
      const current = config.get<boolean>("allowTerminalCommands", false)
      await config.update("allowTerminalCommands", !current, vscode.ConfigurationTarget.Global)
      vscode.window.showInformationMessage(`Terminal permissions ${!current ? "enabled" : "disabled"}`)
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("zombie.openAdminDashboard", async () => {
      await vscode.commands.executeCommand("workbench.action.webview.openDeveloperTools")
      vscode.window.showInformationMessage("Admin Dashboard opened. Dashboard available via webview provider.")
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("zombie.configureProviders", async () => {
      const providers = providerManager.getProviders()
      const items = providers.map((p) => ({
        label: `${p.name} (${p.enabled ? "enabled" : "disabled"})`,
        description: p.model,
        provider: p,
      }))

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "Select a provider to configure",
      })

      if (selected) {
        vscode.window.showInformationMessage(`Provider ${selected.provider.name} selected. Configure in settings.`)
      }
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("zombie.testProviderConnection", async (providerId?: string) => {
      try {
        const pid = providerId || "ollama-local"
        await providerManager.testConnection(pid)
        vscode.window.showInformationMessage("Provider connection test completed.")
      } catch (error) {
        vscode.window.showErrorMessage(`Connection test failed: ${error}`)
      }
    }),
  )

  // Check configuration on startup
  await checkConfiguration(context)

  const defaultProvider = providerManager.getDefaultProvider()
  if (defaultProvider?.type === "ollama") {
    console.log("[v0] Ollama configured as default language model")
  }

  vscode.window.showInformationMessage(
    `Zombie AI Assistant is ready! Using ${defaultProvider?.name} as default model. Press Ctrl+Shift+Z to start chatting.`,
  )

  // Cleanup on deactivate
  context.subscriptions.push({
    dispose: async () => {
      await dashboardManager.cleanup()
    },
  })
}

async function checkConfiguration(context: vscode.ExtensionContext): Promise<void> {
  const config = vscode.workspace.getConfiguration("zombie")
  const endpoint = config.get<string>("endpoint")
  const apiKey = await context.secrets.get("zombie.apiKey")

  if (!endpoint || endpoint === "http://localhost:8001") {
    const result = await vscode.window.showInformationMessage(
      "Zombie: Backend endpoint not configured. Using default localhost:8001",
      "Configure",
      "Dismiss",
    )

    if (result === "Configure") {
      await vscode.commands.executeCommand("workbench.action.openSettings", "zombie.endpoint")
    }
  }

  if (!apiKey) {
    const result = await vscode.window.showWarningMessage(
      "Zombie: API key not set. Please configure your API key.",
      "Set API Key",
      "Dismiss",
    )

    if (result === "Set API Key") {
      const key = await vscode.window.showInputBox({
        prompt: "Enter your Zombie API key",
        password: true,
        placeHolder: "your-secure-api-key",
      })

      if (key) {
        await context.secrets.store("zombie.apiKey", key)
        vscode.window.showInformationMessage("API key saved securely")
      }
    }
  }
}

export function deactivate() {
  console.log("[v0] Zombie AI Assistant is now deactivated")
}
