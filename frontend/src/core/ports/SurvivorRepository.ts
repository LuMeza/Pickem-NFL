import type { SurvivorParticipant, SurvivorPick } from '@/core/entities/survivor'

export interface SaveSurvivorPickParams {
  groupId: string
  userId: string
  weekId: string
  teamId: string
}

/**
 * Ver openspec/changes/modulo-survivor. Acceso implicito por ser miembro del
 * grupo (sin flujo de solicitud/aprobacion, a diferencia de Pickem Semanal).
 */
export interface SurvivorRepository {
  /** Elecciones propias de toda la temporada, para excluir equipos ya usados e historial (tarea 2.5). */
  listMyPicks(groupId: string, userId: string): Promise<SurvivorPick[]>
  savePick(params: SaveSurvivorPickParams): Promise<void>
  /** Estado y roster de todo el grupo (tareas 3.4/3.7) — server-side, ver core/entities/survivor.ts. */
  listGroupState(groupId: string): Promise<SurvivorParticipant[]>
  /** Panel admin, plan B: recalcular a mano si el trigger automatico no corrio. */
  recalculate(groupId: string): Promise<void>
}
