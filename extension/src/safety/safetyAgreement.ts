import * as vscode from "vscode"

const SAFETY_AGREEMENT_VERSION = "1.0"
const AGREEMENT_STORAGE_KEY = "zombie.safetyAgreementAccepted"

export class SafetyAgreement {
  private static instance: SafetyAgreement

  private constructor(private context: vscode.ExtensionContext) {}

  static getInstance(context: vscode.ExtensionContext): SafetyAgreement {
    if (!SafetyAgreement.instance) {
      SafetyAgreement.instance = new SafetyAgreement(context)
    }
    return SafetyAgreement.instance
  }

  async checkAndShowAgreement(): Promise<boolean> {
    const agreed = this.context.globalState.get<boolean>(AGREEMENT_STORAGE_KEY)

    if (agreed) {
      return true
    }

    return this.showAgreementDialog()
  }

  private async showAgreementDialog(): Promise<boolean> {
    const agreementText = `
🧟 ZOMBIE CURSOR AI - Safety & Usage Agreement

Version ${SAFETY_AGREEMENT_VERSION}

INTRODUCTION
ZombieCursor AI is a local-first, privacy-focused AI coding assistant.

KEY PRINCIPLES:
✓ Completely Local Operation - Your code never leaves your computer
✓ No Server Communication - Zero data transmission to external servers
✓ No Login Required - Work offline, completely anonymous
✓ No Subscription Fees - Completely free, no charges ever
✓ No Tracking - No analytics, telemetry, or user tracking
✓ No Personal Data Collection - Your privacy is protected

IMPORTANT SECURITY FACTS:
- All your code and conversations stay on YOUR computer ONLY
- Developer Zone and ZombieCursor team NEVER see your data
- If anyone asks for money using ZombieCursor name = 100% SCAM

YOUR RESPONSIBILITIES:
- Keep your system secure
- Review AI-suggested terminal commands before allowing
- Never share API keys with untrusted parties
- Report security issues to the team

DISCLAIMER:
ZombieCursor is provided "as-is" for free. We are not liable for:
- Hardware damage
- Data loss
- Code deletion or corruption
- Unintended terminal commands

By clicking "I Agree", you accept these terms and confirm you understand:
1. This is local-only software
2. No external monitoring or data collection
3. You control all terminal execution
4. This is provided free without warranties

    `.trim()

    const result = await vscode.window.showInformationMessage(
      "ZombieCursor AI - Safety Agreement",
      { modal: true, detail: agreementText },
      "I Agree & Continue",
      "Decline",
    )

    if (result === "I Agree & Continue") {
      await this.context.globalState.update(AGREEMENT_STORAGE_KEY, true)
      vscode.window.showInformationMessage("Welcome to ZombieCursor! You can now start using the AI assistant.")
      return true
    } else {
      vscode.window.showWarningMessage("ZombieCursor requires you to accept the safety agreement to continue.")
      return false
    }
  }

  async resetAgreement(): Promise<void> {
    await this.context.globalState.update(AGREEMENT_STORAGE_KEY, false)
  }

  hasAgreed(): boolean {
    return this.context.globalState.get<boolean>(AGREEMENT_STORAGE_KEY) ?? false
  }
}
