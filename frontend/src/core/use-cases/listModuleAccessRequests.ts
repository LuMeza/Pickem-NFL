import type { ModuleAccessRepository, ModuleAccessRequest } from '@/core/ports/ModuleAccessRepository'

export interface ListModuleAccessRequestsDeps {
  moduleAccessRepository: ModuleAccessRepository
}

export interface ListModuleAccessRequestsParams {
  groupId: string
}

/** Panel admin: solicitudes de acceso a módulo de un grupo — ver openspec/changes/base-plataforma specs/grupos-privados. */
export function listModuleAccessRequests(
  deps: ListModuleAccessRequestsDeps,
  params: ListModuleAccessRequestsParams,
): Promise<ModuleAccessRequest[]> {
  return deps.moduleAccessRepository.listRequests(params.groupId)
}
