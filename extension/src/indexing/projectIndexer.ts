import * as fs from "fs"
import * as path from "path"
import * as os from "os"

export interface IndexedFile {
  filePath: string
  language: string
  content: string
  size: number
  lastModified: number
}

export interface ProjectIndex {
  projectPath: string
  indexedAt: number
  files: IndexedFile[]
  totalSize: number
  fileCount: number
}

export class ProjectIndexer {
  private static instance: ProjectIndexer
  private indexDir: string
  private supportedExtensions = [".ts", ".tsx", ".js", ".jsx", ".py", ".php", ".html", ".css", ".json", ".md"]
  private maxFileSize = 500 * 1024 // 500KB

  private constructor() {
    this.indexDir = path.join(os.homedir(), ".zombiecursor", "data", "indexes")
    this.ensureDirectoryExists()
  }

  static getInstance(): ProjectIndexer {
    if (!ProjectIndexer.instance) {
      ProjectIndexer.instance = new ProjectIndexer()
    }
    return ProjectIndexer.instance
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.indexDir)) {
      fs.mkdirSync(this.indexDir, { recursive: true })
    }
  }

  async indexProject(projectPath: string): Promise<ProjectIndex> {
    const files: IndexedFile[] = []
    const totalSize = 0

    await this.scanDirectory(projectPath, files, totalSize)

    const index: ProjectIndex = {
      projectPath,
      indexedAt: Date.now(),
      files,
      totalSize,
      fileCount: files.length,
    }

    await this.saveIndex(index)
    return index
  }

  private async scanDirectory(dirPath: string, files: IndexedFile[], totalSize: number): Promise<void> {
    const ignorePatterns = ["node_modules", ".git", ".venv", "dist", "build", ".env"]

    try {
      const entries = fs.readdirSync(dirPath)

      for (const entry of entries) {
        // Skip ignored directories
        if (ignorePatterns.includes(entry)) {
          continue
        }

        const fullPath = path.join(dirPath, entry)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          await this.scanDirectory(fullPath, files, totalSize)
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath)
          if (this.supportedExtensions.includes(ext) && stat.size <= this.maxFileSize) {
            const content = fs.readFileSync(fullPath, "utf-8")
            files.push({
              filePath: fullPath,
              language: this.getLanguage(ext),
              content,
              size: stat.size,
              lastModified: stat.mtime.getTime(),
            })

            totalSize += stat.size
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error)
    }
  }

  private getLanguage(extension: string): string {
    const languageMap: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "javascript",
      ".jsx": "javascript",
      ".py": "python",
      ".php": "php",
      ".html": "html",
      ".css": "css",
      ".json": "json",
      ".md": "markdown",
    }

    return languageMap[extension] || "text"
  }

  async getIndex(projectPath: string): Promise<ProjectIndex | null> {
    const indexPath = this.getIndexPath(projectPath)

    if (!fs.existsSync(indexPath)) {
      return null
    }

    try {
      const content = fs.readFileSync(indexPath, "utf-8")
      return JSON.parse(content)
    } catch (error) {
      console.error("Failed to load index:", error)
      return null
    }
  }

  async searchIndex(projectPath: string, query: string): Promise<IndexedFile[]> {
    const index = await this.getIndex(projectPath)
    if (!index) {
      return []
    }

    const lowerQuery = query.toLowerCase()
    const results: IndexedFile[] = []

    for (const file of index.files) {
      if (file.content.toLowerCase().includes(lowerQuery) || file.filePath.toLowerCase().includes(lowerQuery)) {
        results.push(file)
      }
    }

    return results
  }

  async clearIndex(projectPath: string): Promise<void> {
    const indexPath = this.getIndexPath(projectPath)

    if (fs.existsSync(indexPath)) {
      fs.unlinkSync(indexPath)
    }
  }

  private getIndexPath(projectPath: string): string {
    const hash = projectPath
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
      .toString(16)
    return path.join(this.indexDir, `index_${hash}.json`)
  }

  private async saveIndex(index: ProjectIndex): Promise<void> {
    const indexPath = this.getIndexPath(index.projectPath)

    try {
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2))
    } catch (error) {
      console.error("Failed to save index:", error)
      throw error
    }
  }
}
