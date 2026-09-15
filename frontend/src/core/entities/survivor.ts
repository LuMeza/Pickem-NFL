export type SurvivorLife = 1 | 2 | 3

/**
 * Feedback de producto: al perder con vidas disponibles, el usuario queda
 * "eliminado" de inmediato — no hay estado intermedio de solicitud. Tiene una
 * sola ventana (la semana inmediata siguiente, ver revivalDeadlineWeekId) para
 * revivir eligiendo equipo a tiempo; si la deja pasar, queda eliminado en
 * definitiva.
 */
export type SurvivorStatus = 'alive' | 'eliminated'

export interface SurvivorState {
  currentLife: SurvivorLife
  status: SurvivorStatus
  /** Semana de la primera derrota (fin de la vida original), o null si nunca perdió con su vida original. */
  firstLossWeekId: string | null
  /** Semana de la eliminación definitiva, o null mientras siga vivo. */
  eliminatedWeekId: string | null
  /** Semana en la que, si elige equipo, revive consumiendo una vida extra; null si está vivo o ya eliminado en definitiva. */
  revivalDeadlineWeekId: string | null
}

/**
 * La ausencia de elección de equipo se trata igual que una derrota
 * (ver openspec/changes/modulo-survivor specs/estado-survivor).
 */
export type SurvivorWeeklyOutcome = 'win' | 'loss_or_no_pick'

/**
 * Estado de un participante del grupo, para las pantallas de estado/podio
 * (tareas 3.4/3.7). El cálculo de `SurvivorState` en si corre server-side
 * (función SQL `_survivor_recompute`, ver design.md decision 4 actualizada)
 * para no tener que exponer las elecciones de cada semana de todo el grupo
 * via RLS solo para poder recalcular en el cliente.
 */
export interface SurvivorParticipant extends SurvivorState {
  userId: string
  displayName: string
  finalRank: 1 | 2 | 3 | null
}

/** Elección semanal propia — ver specs/prediccion-survivor. */
export interface SurvivorPick {
  weekId: string
  teamId: string
  lifeNumber: SurvivorLife
}
