import type { AuthRepository } from '@/core/ports/AuthRepository'

export interface GetSessionStatusDeps {
  authRepository: AuthRepository
}

export interface SessionStatus {
  userId: string | null
  mustChangePassword: boolean
}

/** Usado por el guard de rutas — ver openspec/changes/base-plataforma tarea 4.6. */
export async function getSessionStatus(deps: GetSessionStatusDeps): Promise<SessionStatus> {
  const userId = await deps.authRepository.getCurrentUserId()
  if (!userId) return { userId: null, mustChangePassword: false }

  const mustChangePassword = await deps.authRepository.mustChangePassword()
  return { userId, mustChangePassword }
}
