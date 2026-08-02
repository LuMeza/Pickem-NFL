import type { AuthRepository } from '@/core/ports/AuthRepository'

export interface UpdateUserDeps {
  authRepository: AuthRepository
}

export interface UpdateUserParams {
  userId: string
  displayName: string
  email: string
}

/** Panel admin: edita nombre visible y correo de un usuario existente. */
export function updateUser(deps: UpdateUserDeps, params: UpdateUserParams): Promise<void> {
  return deps.authRepository.updateUser(params.userId, params.displayName, params.email)
}
