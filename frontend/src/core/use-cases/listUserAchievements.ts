import type { AchievementsRepository } from '@/core/ports/AchievementsRepository'
import type { AuthRepository } from '@/core/ports/AuthRepository'
import type { ProfileAchievement } from '@/core/entities/achievement'

export interface ListUserAchievementsDeps {
  achievementsRepository: AchievementsRepository
  authRepository: AuthRepository
}

/**
 * Catálogo completo de logros con estado desbloqueado/bloqueado para el
 * usuario actual — ver openspec/changes/sistema-logros-perfil specs/logros.
 */
export async function listUserAchievements(deps: ListUserAchievementsDeps): Promise<ProfileAchievement[]> {
  const userId = await deps.authRepository.getCurrentUserId()
  if (!userId) throw new Error('No hay sesión activa')
  const [catalog, unlocked] = await Promise.all([
    deps.achievementsRepository.listCatalog(),
    deps.achievementsRepository.listUnlockedAchievements(userId),
  ])
  // Un logro por grupo puede repetirse (mismo id en varios grupos): se queda la primera vez.
  const firstUnlock = new Map<string, Date>()
  for (const { achievementId, unlockedAt } of unlocked) {
    const previous = firstUnlock.get(achievementId)
    if (!previous || unlockedAt < previous) firstUnlock.set(achievementId, unlockedAt)
  }
  return catalog.map((achievement) => ({
    ...achievement,
    unlocked: firstUnlock.has(achievement.id),
    unlockedAt: firstUnlock.get(achievement.id) ?? null,
  }))
}
