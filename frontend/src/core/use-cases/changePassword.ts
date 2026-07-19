import type { AuthRepository } from '@/core/ports/AuthRepository'

export interface ChangePasswordDeps {
  authRepository: AuthRepository
}

export interface ChangePasswordParams {
  newPassword: string
}

/** Cambio de contrasena obligatorio en el primer login — ver openspec/changes/base-plataforma specs/auth-usuarios. */
export function changePassword(deps: ChangePasswordDeps, params: ChangePasswordParams): Promise<void> {
  return deps.authRepository.changePassword(params.newPassword)
}
