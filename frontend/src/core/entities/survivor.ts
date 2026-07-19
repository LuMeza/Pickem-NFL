export type SurvivorLife = 1 | 2 | 3

export type SurvivorStatus = 'alive' | 'eliminated'

export interface SurvivorState {
  currentLife: SurvivorLife
  status: SurvivorStatus
  /** Semana de la primera derrota (fin de la vida original), o null si nunca perdio con su vida original. */
  firstLossWeekId: string | null
  /** Semana de la eliminacion definitiva, o null mientras siga vivo. */
  eliminatedWeekId: string | null
}

/**
 * La ausencia de eleccion de equipo se trata igual que una derrota
 * (ver openspec/changes/modulo-survivor specs/estado-survivor).
 */
export type SurvivorWeeklyOutcome = 'win' | 'loss_or_no_pick'
