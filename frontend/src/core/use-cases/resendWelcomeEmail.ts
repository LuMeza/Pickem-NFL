import type { AuthRepository, ProvisionalUserAccount } from '@/core/ports/AuthRepository'

export interface ResendWelcomeEmailDeps {
  authRepository: AuthRepository
}

export interface ResendWelcomeEmailParams {
  userId: string
}

/** Panel admin: reenvía el correo de bienvenida con una nueva contraseña provisional. */
export function resendWelcomeEmail(
  deps: ResendWelcomeEmailDeps,
  params: ResendWelcomeEmailParams,
): Promise<ProvisionalUserAccount> {
  return deps.authRepository.resendWelcomeEmail(params.userId)
}
