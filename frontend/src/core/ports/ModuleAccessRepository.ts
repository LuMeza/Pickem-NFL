export type GameModule = 'quiniela_semanal' | 'survivor' | 'playoffs'

export type ModuleAccessStatus = 'solicitado' | 'aprobado' | 'rechazado'

/** Ver openspec/changes/base-plataforma specs/grupos-privados (solicitud/aprobacion de acceso a modulo). */
export interface ModuleAccessRepository {
  requestAccess(groupId: string, userId: string, module: GameModule): Promise<void>
  approveAccess(groupId: string, userId: string, module: GameModule): Promise<void>
  rejectAccess(groupId: string, userId: string, module: GameModule): Promise<void>
  getAccessStatus(groupId: string, userId: string, module: GameModule): Promise<ModuleAccessStatus | null>
}
