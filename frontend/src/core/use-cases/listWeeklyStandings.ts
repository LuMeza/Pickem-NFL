import type { PickemStandingsRepository } from '@/core/ports/PickemStandingsRepository'
import type { StandingRow } from '@/core/entities/standings'

export interface ListWeeklyStandingsDeps {
  pickemStandingsRepository: PickemStandingsRepository
}

export interface ListWeeklyStandingsParams {
  groupId: string
  weekId: string
}

/** Tabla de posiciones de una semana — ver specs/tabla-pickem-semanal. */
export function listWeeklyStandings(
  deps: ListWeeklyStandingsDeps,
  params: ListWeeklyStandingsParams,
): Promise<StandingRow[]> {
  return deps.pickemStandingsRepository.listWeeklyStandings(params.groupId, params.weekId)
}
