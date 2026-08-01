import type { AuthRepository } from '@/core/ports/AuthRepository'

export interface CheckPlatformAdminDeps {
  authRepository: AuthRepository
}

/** Usado por el guard del panel admin — ver openspec/changes/base-plataforma tarea 7.3. */
export function checkPlatformAdmin(deps: CheckPlatformAdminDeps): Promise<boolean> {
  return deps.authRepository.isPlatformAdmin()
}
