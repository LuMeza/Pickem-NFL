import type { AuthRepository } from '@/core/ports/AuthRepository'

export interface RequestPasswordResetDeps {
  authRepository: AuthRepository
}

export interface RequestPasswordResetParams {
  email: string
}

/** Envia el correo de recuperacion de contrasena — pantalla "Olvide mi contrasena". */
export function requestPasswordReset(
  deps: RequestPasswordResetDeps,
  params: RequestPasswordResetParams,
): Promise<void> {
  return deps.authRepository.requestPasswordReset(params.email)
}
