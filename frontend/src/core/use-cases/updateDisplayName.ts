import type { AuthRepository } from '@/core/ports/AuthRepository'

export interface UpdateDisplayNameDeps {
  authRepository: AuthRepository
}

export interface UpdateDisplayNameParams {
  displayName: string
}

/** Edicion de nombre visible — ver openspec/changes/base-plataforma specs/auth-usuarios. */
export function updateDisplayName(deps: UpdateDisplayNameDeps, params: UpdateDisplayNameParams): Promise<void> {
  return deps.authRepository.updateDisplayName(params.displayName)
}
