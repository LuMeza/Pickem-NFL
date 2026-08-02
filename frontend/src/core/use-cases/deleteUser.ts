import type { AuthRepository } from '@/core/ports/AuthRepository'

export interface DeleteUserDeps {
  authRepository: AuthRepository
}

export interface DeleteUserParams {
  userId: string
}

/** Panel admin: elimina la cuenta de un usuario (baja definitiva). */
export function deleteUser(deps: DeleteUserDeps, params: DeleteUserParams): Promise<void> {
  return deps.authRepository.deleteUser(params.userId)
}
