import type { AdminUserSummary, AuthRepository } from '@/core/ports/AuthRepository'

export interface ListUsersDeps {
  authRepository: AuthRepository
}

/** Panel admin: listado de todos los usuarios de la plataforma. */
export function listUsers(deps: ListUsersDeps): Promise<AdminUserSummary[]> {
  return deps.authRepository.listUsers()
}
