import type { SurvivorLife, SurvivorLifeRequest, SurvivorParticipant, SurvivorPick } from '@/core/entities/survivor'

export interface SaveSurvivorPickParams {
  groupId: string
  userId: string
  weekId: string
  teamId: string
}

export type SurvivorLifeRequestDecision = 'aprobado' | 'rechazado'

/**
 * Ver openspec/changes/modulo-survivor. Acceso implícito por ser miembro del
 * grupo (sin flujo de solicitud/aprobación, a diferencia de Pickem Semanal).
 * Las vidas extra si tienen su propio flujo de solicitud/aprobación — ver
 * design.md decision 7.
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
  /** Pide la siguiente vida extra tras perder (design.md decision 7). */
  requestLife(groupId: string, userId: string, lifeNumber: SurvivorLife): Promise<void>
  /** Panel admin: solicitudes de vida pendientes de un grupo. */
  listLifeRequests(groupId: string): Promise<SurvivorLifeRequest[]>
  /** Panel admin: aprobar o rechazar una solicitud de vida. */
  resolveLifeRequest(requestId: string, decision: SurvivorLifeRequestDecision): Promise<void>
}
