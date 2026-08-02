import type { AuthRepository } from '@/core/ports/AuthRepository'
import type { Profile } from '@/core/entities/profile'

export interface GetProfileDeps {
  authRepository: AuthRepository
}

/** Perfil básico del usuario autenticado — ver openspec/changes/base-plataforma specs/auth-usuarios. */
export function getProfile(deps: GetProfileDeps): Promise<Profile> {
  return deps.authRepository.getProfile()
}
