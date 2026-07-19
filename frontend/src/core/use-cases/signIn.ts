import type { AuthRepository } from '@/core/ports/AuthRepository'

export interface SignInDeps {
  authRepository: AuthRepository
}

export interface SignInParams {
  email: string
  password: string
}

export interface SignInResult {
  mustChangePassword: boolean
}

/** Login — ver openspec/changes/base-plataforma specs/auth-usuarios. */
export async function signIn(deps: SignInDeps, params: SignInParams): Promise<SignInResult> {
  await deps.authRepository.signIn(params.email, params.password)
  const mustChangePassword = await deps.authRepository.mustChangePassword()
  return { mustChangePassword }
}
