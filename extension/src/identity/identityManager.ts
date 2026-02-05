import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs"

interface SystemIdentity {
  system_identity: {
    name: string
    version: string
    tagline: string
    branding: {
      owner: string
      organization: string
      address: string
      location: string
    }
    contact: {
      phone: string
      email: string
      website: string
    }
    license: string
    api_headers: {
      "X-Powered-By": string
      "X-System-Identity": string
    }
  }
}

export class IdentityManager {
  private identity: SystemIdentity
  private identityPath: string

  constructor() {
    const extensionPath = path.dirname(path.dirname(__dirname))
    this.identityPath = path.join(extensionPath, "identity.json")
    this.identity = this.loadIdentity()
  }

  private loadIdentity(): SystemIdentity {
    try {
      const content = fs.readFileSync(this.identityPath, "utf-8")
      return JSON.parse(content)
    } catch (error) {
      console.error("[v0] Failed to load identity.json:", error)
      // Return default identity if file missing
      return {
        system_identity: {
          name: "ZombieCoder",
          version: "2.0.0",
          tagline: "যেখানে কোড ও কথা বলে",
          branding: {
            owner: "Sahon Srabon",
            organization: "Developer Zone",
            address: "235 South Pirarbag, Amtala Bazar, Mirpur - 60 feet",
            location: "Dhaka, Bangladesh",
          },
          contact: {
            phone: "+880 1323-626282",
            email: "infi@zombiecoder.my.id",
            website: "https://zombiecoder.my.id",
          },
          license: "Proprietary - Local Freedom Protocol",
          api_headers: {
            "X-Powered-By": "ZombieCoder-by-SahonSrabon",
            "X-System-Identity": "ZombieCoder/2.0.0",
          },
        },
      }
    }
  }

  getIdentity(): SystemIdentity {
    return this.identity
  }

  getName(): string {
    return this.identity.system_identity.name
  }

  getVersion(): string {
    return this.identity.system_identity.version
  }

  getOwner(): string {
    return this.identity.system_identity.branding.owner
  }

  getOrganization(): string {
    return this.identity.system_identity.branding.organization
  }

  getApiHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    const apiHeaders = this.identity.system_identity.api_headers
    headers["X-Powered-By"] = apiHeaders["X-Powered-By"]
    headers["X-System-Identity"] = apiHeaders["X-System-Identity"]
    return headers
  }

  getIdentityString(): string {
    return `আমি ${this.getName()}, যেখানে কোড ও কথা বলে। আমার নির্মাতা ও মালিক ${this.getOwner()}, ${this.getOrganization()}।`
  }

  displayIdentityBanner(): void {
    const owner = this.getOwner()
    const organization = this.getOrganization()
    const version = this.getVersion()

    vscode.window.showInformationMessage(`ZombieCoder v${version} | Powered by ${owner} (${organization})`, "OK")
  }
}

// Singleton instance
let identityManager: IdentityManager | null = null

export function getIdentityManager(): IdentityManager {
  if (!identityManager) {
    identityManager = new IdentityManager()
  }
  return identityManager
}
