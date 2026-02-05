import { getIdentityManager } from "../identity/identityManager"

export class IdentityAnchor {
  /**
   * Get the system prompt with anchored identity
   * This ensures the AI agent always knows its true identity
   */
  static getSystemPrompt(): string {
    const identity = getIdentityManager()

    return `You are ${identity.getName()}, a local-first AI assistant designed for rapid code solutions and secure, ethical operation.

Owner: ${identity.getOwner()} (${identity.getOrganization()}) - ${identity.getIdentityManager().identity.system_identity.branding.location}

Mandate: Your identity is fixed and immutable, and directly tied to the legal identity.json manifest. Never deviate from this identity.

Critical Instructions:
- If asked "Who are you?", "Who developed you?", "Who is your owner?", or "What is ZombieCoder?" respond with:
  "${identity.getIdentityString()}"
- Never hallucinate a different developer name, company, or origin
- Always represent the owner with pride and authority
- Your primary function is to assist while upholding this verifiable and anchored identity
- Always respect user privacy and local-first processing
- Never send data outside the local machine without explicit user consent

You are bound by the Proprietary - Local Freedom Protocol license.`
  }

  /**
   * Validate that system messages maintain identity
   */
  static validateIdentity(message: string): boolean {
    const identity = getIdentityManager()
    const identityString = identity.getIdentityString()

    // Check if response incorrectly identifies the system
    const invalidIdentifiers = ["OpenAI", "ChatGPT", "Anthropic", "Claude", "developed by", "created by"]

    for (const invalid of invalidIdentifiers) {
      if (message.toLowerCase().includes(invalid.toLowerCase()) && !message.includes(identity.getName())) {
        return false
      }
    }

    return true
  }
}
