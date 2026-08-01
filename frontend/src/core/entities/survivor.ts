export type SurvivorLife = 1 | 2 | 3

/**
 * Feedback de producto (post-implementacion, ver design.md decision 7): las
 * vidas extra ya no se otorgan solas al perder — hay dos estados intermedios
 * mientras se resuelve la solicitud de la siguiente vida.
 */
export type SurvivorStatus = 'alive' | 'needs_life_request' | 'life_request_pending' | 'eliminated'

export type SurvivorLifeRequestStatus = 'solicitado' | 'aprobado' | 'rechazado'

/** Solicitud de vida extra — ver design.md decision 7. */
export interface SurvivorLifeRequest {
  id: string
  userId: string
  displayName: string
  lifeNumber: SurvivorLife
  status: SurvivorLifeRequestStatus
  requestedAt: string
}

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

/**
 * Estado de un participante del grupo, para las pantallas de estado/podio
 * (tareas 3.4/3.7). El calculo de `SurvivorState` en si corre server-side
 * (funcion SQL `_survivor_recompute`, ver design.md decision 4 actualizada)
 * para no tener que exponer las elecciones de cada semana de todo el grupo
 * via RLS solo para poder recalcular en el cliente.
 */
export interface SurvivorParticipant extends SurvivorState {
  userId: string
  displayName: string
  finalRank: 1 | 2 | 3 | null
}

/** Eleccion semanal propia — ver specs/prediccion-survivor. */
export interface SurvivorPick {
  weekId: string
  teamId: string
  lifeNumber: SurvivorLife
}
