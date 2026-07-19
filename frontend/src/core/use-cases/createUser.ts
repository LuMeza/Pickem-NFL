import type { AuthRepository, ProvisionalUserAccount } from '@/core/ports/AuthRepository'

export interface CreateUserDeps {
  authRepository: AuthRepository
}

export interface CreateUserParams {
  email: string
  displayName: string
}

/** Alta de usuario por el administrador — ver openspec/changes/base-plataforma specs/auth-usuarios. */
export function createUser(deps: CreateUserDeps, params: CreateUserParams): Promise<ProvisionalUserAccount> {
  return deps.authRepository.createUser(params.email, params.displayName)
}
