import type { AuthRepository } from '@/core/ports/AuthRepository'

export interface SignOutDeps {
  authRepository: AuthRepository
}

/** Cierre de sesion. */
export function signOut(deps: SignOutDeps): Promise<void> {
  return deps.authRepository.signOut()
}
