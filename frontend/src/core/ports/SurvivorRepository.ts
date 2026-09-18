import type { SurvivorParticipant, SurvivorPick } from '@/core/entities/survivor'

export interface SaveSurvivorPickParams {
  groupId: string
  userId: string
  weekId: string
  teamId: string
}

/**
 * Ver openspec/changes/modulo-survivor. Acceso implícito por ser miembro del
 * grupo (sin flujo de solicitud/aprobación, a diferencia de Pickem Semanal).
 * Las vidas extra se otorgan solas al elegir equipo dentro de la ventana de
 * revivir (ver core/entities/survivor.ts SurvivorState.revivalDeadlineWeekId).
 */
export interface SurvivorRepository {
  /** Elecciones propias de toda la temporada, para excluir equipos ya usados e historial (tarea 2.5). */
  listMyPicks(groupId: string, userId: string): Promise<SurvivorPick[]>
  savePick(params: SaveSurvivorPickParams): Promise<void>
  /** Estado y roster de todo el grupo (tareas 3.4/3.7) — server-side, ver core/entities/survivor.ts. */
  listGroupState(groupId: string): Promise<SurvivorParticipant[]>
  /** Panel admin, plan B: recalcular a mano si el trigger automático no corrio. */
  recalculate(groupId: string): Promise<void>
  /** Número de la semana regular actualmente abierta, o null si ya se resolvieron todas (design.md decision 8). */
  getCurrentWeekNumber(): Promise<number | null>
  /** True si el usuario tiene una excepción de pick activa (habilitada por el admin) para esa semana — ver survivor-acceso-excepcional-pick. */
  hasActivePickException(groupId: string, userId: string, weekId: string): Promise<boolean>
}
