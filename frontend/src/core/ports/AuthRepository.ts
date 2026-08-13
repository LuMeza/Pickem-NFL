import type { Profile } from '@/core/entities/profile'

export interface ProvisionalUserAccount {
  userId: string
  provisionalPassword: string
  emailSent: boolean
}

export interface AdminUserSummary {
  userId: string
  displayName: string
  email: string
  createdAt: Date
  isAdmin: boolean
}

/**
 * Ver openspec/changes/base-plataforma specs/auth-usuarios.
 * `createUser` solo la puede invocar el administrador de plataforma; la
 * verificación de permiso ocurre en la Edge Function, no en el cliente.
 */
export interface AuthRepository {
  createUser(email: string, displayName: string): Promise<ProvisionalUserAccount>
  resendWelcomeEmail(userId: string): Promise<ProvisionalUserAccount>
  listUsers(): Promise<AdminUserSummary[]>
  updateUser(userId: string, displayName: string, email: string): Promise<void>
  deleteUser(userId: string): Promise<void>
  grantPlatformAdmin(userId: string): Promise<void>
  revokePlatformAdmin(userId: string): Promise<void>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  changePassword(newPassword: string): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  getCurrentUserId(): Promise<string | null>
  mustChangePassword(): Promise<boolean>
  getProfile(): Promise<Profile>
  updateDisplayName(displayName: string): Promise<void>
  isPlatformAdmin(): Promise<boolean>
}
