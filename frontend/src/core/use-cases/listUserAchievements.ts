import type { AchievementsRepository } from '@/core/ports/AchievementsRepository'
import type { ProfileAchievement } from '@/core/entities/achievement'

export interface ListUserAchievementsDeps {
  achievementsRepository: AchievementsRepository
}

/**
 * Catálogo completo de logros con estado desbloqueado/bloqueado para el
 * usuario actual — ver openspec/changes/sistema-logros-perfil specs/logros.
 */
export async function listUserAchievements(deps: ListUserAchievementsDeps): Promise<ProfileAchievement[]> {
  const [catalog, unlockedIds] = await Promise.all([
    deps.achievementsRepository.listCatalog(),
    deps.achievementsRepository.listMyUnlockedAchievementIds(),
  ])
  const unlockedSet = new Set(unlockedIds)
  return catalog.map((achievement) => ({
    ...achievement,
    unlocked: unlockedSet.has(achievement.id),
  }))
}
