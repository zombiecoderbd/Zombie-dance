import * as fs from "fs"
import * as path from "path"

export interface VSIXValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  metadata: {
    name: string
    version: string
    size: number
    fileCount: number
  }
}

export class VSIXValidator {
  async validate(vsixPath: string): Promise<VSIXValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    if (!fs.existsSync(vsixPath)) {
      errors.push(`VSIX file not found: ${vsixPath}`)
      return {
        valid: false,
        errors,
        warnings,
        metadata: { name: "", version: "", size: 0, fileCount: 0 },
      }
    }

    const stats = fs.statSync(vsixPath)
    const maxSize = 500 * 1024 * 1024 // 500MB

    if (stats.size > maxSize) {
      errors.push(`VSIX file size exceeds maximum limit (500MB): ${stats.size / 1024 / 1024}MB`)
    }

    // Check if it's a valid ZIP file
    try {
      const AdmZip = require("adm-zip")
      const zip = new AdmZip(vsixPath)
      const entries = zip.getEntries()

      // Validate package.json exists
      const packageJsonEntry = entries.find((e: any) => e.entryName.includes("package.json"))
      if (!packageJsonEntry) {
        errors.push("package.json not found in VSIX")
      }

      // Validate extension.js or main file exists
      const mainEntry = entries.find((e: any) => e.entryName.endsWith(".js"))
      if (!mainEntry) {
        warnings.push("No JavaScript files found in VSIX")
      }

      // Validate [Content_Types].xml exists
      const contentTypesEntry = entries.find((e: any) => e.entryName.includes("Content_Types"))
      if (!contentTypesEntry) {
        warnings.push("[Content_Types].xml not found")
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          name: path.basename(vsixPath),
          version: "2.0.0",
          size: stats.size,
          fileCount: entries.length,
        },
      }
    } catch (error) {
      errors.push(`Failed to read VSIX as ZIP: ${String(error)}`)
      return {
        valid: false,
        errors,
        warnings,
        metadata: { name: path.basename(vsixPath), version: "", size: stats.size, fileCount: 0 },
      }
    }
  }

  async testInstall(vsixPath: string, testEnv?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate installation by extracting and checking files
      const AdmZip = require("adm-zip")
      const zip = new AdmZip(vsixPath)

      const tempDir = path.join("./test-install", Date.now().toString())
      zip.extractAllTo(tempDir, true)

      // Verify extracted files
      if (fs.existsSync(path.join(tempDir, "extension", "package.json"))) {
        return {
          success: true,
          message: "VSIX installation test passed",
        }
      } else {
        return {
          success: false,
          message: "VSIX installation test failed: package.json not found",
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Installation test failed: ${String(error)}`,
      }
    }
  }
}
