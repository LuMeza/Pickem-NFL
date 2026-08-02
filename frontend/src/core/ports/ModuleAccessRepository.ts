export type GameModule = 'pickem_semanal' | 'survivor' | 'playoffs'

export type ModuleAccessStatus = 'solicitado' | 'aprobado' | 'rechazado'

export interface ModuleAccessRequest {
  userId: string
  displayName: string
  module: GameModule
  status: ModuleAccessStatus
}

/** Ver openspec/changes/base-plataforma specs/grupos-privados (solicitud/aprobación de acceso a módulo). */
export interface ModuleAccessRepository {
  requestAccess(groupId: string, userId: string, module: GameModule): Promise<void>
  approveAccess(groupId: string, userId: string, module: GameModule): Promise<void>
  rejectAccess(groupId: string, userId: string, module: GameModule): Promise<void>
  getAccessStatus(groupId: string, userId: string, module: GameModule): Promise<ModuleAccessStatus | null>
  /** Panel admin: solicitudes de acceso a módulo de un grupo, para aprobar/rechazar (tarea 5.6). */
  listRequests(groupId: string): Promise<ModuleAccessRequest[]>
}
