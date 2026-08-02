import type { AuthRepository } from '@/core/ports/AuthRepository'

export interface RequestPasswordResetDeps {
  authRepository: AuthRepository
}

export interface RequestPasswordResetParams {
  email: string
}

/** Envia el correo de recuperación de contraseña — pantalla "Olvide mi contraseña". */
export function requestPasswordReset(
  deps: RequestPasswordResetDeps,
  params: RequestPasswordResetParams,
): Promise<void> {
  return deps.authRepository.requestPasswordReset(params.email)
}
