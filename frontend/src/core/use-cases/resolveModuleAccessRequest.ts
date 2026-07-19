import type { GameModule, ModuleAccessRepository } from '@/core/ports/ModuleAccessRepository'

export interface ResolveModuleAccessRequestDeps {
  moduleAccessRepository: ModuleAccessRepository
}

export interface ResolveModuleAccessRequestParams {
  groupId: string
  userId: string
  module: GameModule
  decision: 'aprobado' | 'rechazado'
}

/** Aprobacion/rechazo de acceso a modulo por el administrador — ver openspec/changes/base-plataforma specs/grupos-privados. */
export function resolveModuleAccessRequest(
  deps: ResolveModuleAccessRequestDeps,
  params: ResolveModuleAccessRequestParams,
): Promise<void> {
  return params.decision === 'aprobado'
    ? deps.moduleAccessRepository.approveAccess(params.groupId, params.userId, params.module)
    : deps.moduleAccessRepository.rejectAccess(params.groupId, params.userId, params.module)
}
