export type UserRole = "admin" | "developer" | "viewer"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  lastLogin?: number
  createdAt: number
  settings: Record<string, any>
}

export interface PermissionSet {
  canManageExtensions: boolean
  canConfigureProviders: boolean
  canAccessMonitoring: boolean
  canManageUsers: boolean
  canAccessSettings: boolean
  canViewLogs: boolean
}

export class UserManager {
  private static instance: UserManager
  private users: Map<string, User> = new Map()
  private permissions: Map<UserRole, PermissionSet> = new Map()

  private constructor() {
    this.initializeDefaultRoles()
  }

  static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager()
    }
    return UserManager.instance
  }

  private initializeDefaultRoles(): void {
    // Admin permissions
    this.permissions.set("admin", {
      canManageExtensions: true,
      canConfigureProviders: true,
      canAccessMonitoring: true,
      canManageUsers: true,
      canAccessSettings: true,
      canViewLogs: true,
    })

    // Developer permissions
    this.permissions.set("developer", {
      canManageExtensions: false,
      canConfigureProviders: true,
      canAccessMonitoring: true,
      canManageUsers: false,
      canAccessSettings: true,
      canViewLogs: true,
    })

    // Viewer permissions
    this.permissions.set("viewer", {
      canManageExtensions: false,
      canConfigureProviders: false,
      canAccessMonitoring: true,
      canManageUsers: false,
      canAccessSettings: false,
      canViewLogs: true,
    })
  }

  addUser(user: Omit<User, "id" | "createdAt">): string {
    const id = `user-${Date.now()}`
    const newUser: User = {
      ...user,
      id,
      createdAt: Date.now(),
    }

    this.users.set(id, newUser)
    return id
  }

  getUser(id: string): User | undefined {
    return this.users.get(id)
  }

  getUsers(): User[] {
    return Array.from(this.users.values())
  }

  updateUser(id: string, updates: Partial<User>): void {
    const user = this.users.get(id)
    if (!user) throw new Error(`User ${id} not found`)

    Object.assign(user, updates)
  }

  removeUser(id: string): void {
    this.users.delete(id)
  }

  getPermissions(role: UserRole): PermissionSet {
    return (
      this.permissions.get(role) || {
        canManageExtensions: false,
        canConfigureProviders: false,
        canAccessMonitoring: false,
        canManageUsers: false,
        canAccessSettings: false,
        canViewLogs: false,
      }
    )
  }

  hasPermission(userId: string, permission: keyof PermissionSet): boolean {
    const user = this.users.get(userId)
    if (!user) return false

    const permissions = this.getPermissions(user.role)
    return permissions[permission]
  }

  updateLastLogin(userId: string): void {
    const user = this.users.get(userId)
    if (user) {
      user.lastLogin = Date.now()
    }
  }
}
