export type WeeklyAccessStatus = 'solicitado' | 'aprobado' | 'rechazado'

export interface WeeklyAccessRequest {
  userId: string
  displayName: string
  weekId: string
  status: WeeklyAccessStatus
}

/**
 * Acceso al pickem semanal, por (grupo, usuario, semana) — ver
 * openspec/changes/modulo-pickem-semanal specs/acceso-semanal-pickem.
 * Reemplaza, solo para este modulo, al `ModuleAccessRepository` generico de
 * `grupos-privados` (que sigue vigente para Survivor y Playoffs).
 */
export interface WeeklyAccessRepository {
  requestAccess(groupId: string, userId: string, weekId: string): Promise<void>
  approveAccess(groupId: string, userId: string, weekId: string): Promise<void>
  rejectAccess(groupId: string, userId: string, weekId: string): Promise<void>
  getAccessStatus(groupId: string, userId: string, weekId: string): Promise<WeeklyAccessStatus | null>
  /** Panel admin: solicitudes de acceso semanal de un grupo, para aprobar/rechazar. */
  listRequests(groupId: string): Promise<WeeklyAccessRequest[]>
}
