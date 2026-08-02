import type { SurvivorRankingCandidate, SurvivorRankingGroup } from '@/core/entities/survivorRanking'

/**
 * Regla de Survivor (ver openspec/changes/modulo-survivor specs/estado-survivor
 * y openspec/changes/arquitectura-frontend, tarea 3.7).
 * Ordena a los candidatos al podio por semana de eliminación (más tarde = mejor
 * posición) y desempata por duración con la vida original. Si tras ese
 * desempate persiste el empate, se reporta el grupo empatado sin forzar más
 * resolución.
 *
 * El llamador es responsable de asignarle al último usuario "vivo" (1er lugar)
 * un `eliminatedWeekOrder` mayor a cualquier semana real de eliminación.
 */
export function resolveSurvivorRanking(candidates: SurvivorRankingCandidate[]): SurvivorRankingGroup[] {
  const sorted = [...candidates].sort((a, b) => {
    if (b.eliminatedWeekOrder !== a.eliminatedWeekOrder) {
      return b.eliminatedWeekOrder - a.eliminatedWeekOrder
    }
    return (b.firstLossWeekOrder ?? -1) - (a.firstLossWeekOrder ?? -1)
  })

  const groups: SurvivorRankingGroup[] = []
  let lastKey: string | null = null

  for (const candidate of sorted) {
    const key = `${candidate.eliminatedWeekOrder}:${candidate.firstLossWeekOrder ?? 'none'}`
    const lastGroup = groups[groups.length - 1]

    if (lastGroup && key === lastKey) {
      lastGroup.userIds.push(candidate.userId)
      continue
    }

    groups.push({ position: groups.reduce((count, g) => count + g.userIds.length, 0) + 1, userIds: [candidate.userId] })
    lastKey = key
  }

  return groups
}
