import type { AchievementsRepository } from '@/core/ports/AchievementsRepository'
import type { AuthRepository } from '@/core/ports/AuthRepository'
import type { ProfileWeeklyTrendPoint } from '@/core/entities/achievement'

export interface GetProfileWeeklyTrendDeps {
  achievementsRepository: AchievementsRepository
  authRepository: AuthRepository
}

/** Aciertos por semana del usuario, para el grafico de tendencia del perfil. */
export async function getProfileWeeklyTrend(deps: GetProfileWeeklyTrendDeps): Promise<ProfileWeeklyTrendPoint[]> {
  const userId = await deps.authRepository.getCurrentUserId()
  if (!userId) throw new Error('No hay sesión activa')
  return deps.achievementsRepository.getProfileWeeklyTrend(userId)
}
