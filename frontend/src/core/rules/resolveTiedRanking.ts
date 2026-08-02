import type { RankingEntry, RankingGroup } from '@/core/entities/ranking'

/**
 * Regla compartida entre Pickem Semanal y Playoffs
 * (ver openspec/changes/arquitectura-frontend, decision 5 / tarea 3.3).
 * Agrupa a los usuarios empatados en una posición sin aplicar ninguna
 * regla de desempate: el sistema solo reporta el empate.
 */
export function resolveTiedRanking(entries: RankingEntry[]): RankingGroup[] {
  const sorted = [...entries].sort((a, b) => b.total - a.total)
  const groups: RankingGroup[] = []

  for (const entry of sorted) {
    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.total === entry.total) {
      lastGroup.userIds.push(entry.userId)
      continue
    }

    const usersRankedSoFar = groups.reduce((count, group) => count + group.userIds.length, 0)
    groups.push({ position: usersRankedSoFar + 1, total: entry.total, userIds: [entry.userId] })
  }

  return groups
}
