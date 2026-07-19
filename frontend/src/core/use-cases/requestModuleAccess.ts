import type { GameModule, ModuleAccessRepository } from '@/core/ports/ModuleAccessRepository'

export interface RequestModuleAccessDeps {
  moduleAccessRepository: ModuleAccessRepository
}

export interface RequestModuleAccessParams {
  groupId: string
  userId: string
  module: GameModule
}

/** Solicitud de acceso a un modulo opcional — ver openspec/changes/base-plataforma specs/grupos-privados. */
export function requestModuleAccess(
  deps: RequestModuleAccessDeps,
  params: RequestModuleAccessParams,
): Promise<void> {
  return deps.moduleAccessRepository.requestAccess(params.groupId, params.userId, params.module)
}
