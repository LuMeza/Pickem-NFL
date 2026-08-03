import type { AuthRepository } from '@/core/ports/AuthRepository'

export interface SetPlatformAdminDeps {
  authRepository: AuthRepository
}

export interface SetPlatformAdminParams {
  userId: string
  isAdmin: boolean
}

/** Panel admin: agregar/quitar administrador de plataforma — ver design.md decision 2 (base-plataforma). */
export function setPlatformAdmin(deps: SetPlatformAdminDeps, params: SetPlatformAdminParams): Promise<void> {
  return params.isAdmin
    ? deps.authRepository.grantPlatformAdmin(params.userId)
    : deps.authRepository.revokePlatformAdmin(params.userId)
}
