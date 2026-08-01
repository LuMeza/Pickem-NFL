import type { AchievementsRepository } from '@/core/ports/AchievementsRepository'
import type { AuthRepository } from '@/core/ports/AuthRepository'
import type { ProfilePickemSummary } from '@/core/entities/achievement'

export interface GetProfileStatsDeps {
  achievementsRepository: AchievementsRepository
  authRepository: AuthRepository
}

/**
 * Resumen de aciertos del usuario para el header "stat card" del perfil,
 * transversal a todos sus grupos — ver
 * openspec/changes/sistema-logros-perfil specs/perfil-estadisticas.
 */
export async function getProfileStats(deps: GetProfileStatsDeps): Promise<ProfilePickemSummary> {
  const userId = await deps.authRepository.getCurrentUserId()
  if (!userId) throw new Error('No hay sesion activa')
  return deps.achievementsRepository.getProfilePickemSummary(userId)
}
