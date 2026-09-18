import type { SurvivorRepository } from '@/core/ports/SurvivorRepository'

export interface GetSurvivorPickExceptionDeps {
  survivorRepository: SurvivorRepository
}

export interface GetSurvivorPickExceptionParams {
  groupId: string
  userId: string
  weekId: string
}

/** Pantalla de pick: si el usuario tiene un acceso excepcional activo para la semana que está viendo. */
export function getSurvivorPickException(
  deps: GetSurvivorPickExceptionDeps,
  params: GetSurvivorPickExceptionParams,
): Promise<boolean> {
  return deps.survivorRepository.hasActivePickException(params.groupId, params.userId, params.weekId)
}
