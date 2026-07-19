export interface ProvisionalUserAccount {
  userId: string
  provisionalPassword: string
}

/**
 * Ver openspec/changes/base-plataforma specs/auth-usuarios.
 * `createUser` solo la puede invocar el administrador de plataforma; la
 * verificacion de permiso ocurre en la Edge Function, no en el cliente.
 */
export interface AuthRepository {
  createUser(email: string, displayName: string): Promise<ProvisionalUserAccount>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  changePassword(newPassword: string): Promise<void>
  getCurrentUserId(): Promise<string | null>
  mustChangePassword(): Promise<boolean>
}
