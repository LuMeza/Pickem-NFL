import type { GameModule, ModuleAccessRepository, ModuleAccessStatus } from '@/core/ports/ModuleAccessRepository'

export interface GetModuleAccessStatusDeps {
  moduleAccessRepository: ModuleAccessRepository
}

export interface GetModuleAccessStatusParams {
  groupId: string
  userId: string
  module: GameModule
}

/** Estado de acceso propio a un modulo — ver specs/grupos-privados. */
export function getModuleAccessStatus(
  deps: GetModuleAccessStatusDeps,
  params: GetModuleAccessStatusParams,
): Promise<ModuleAccessStatus | null> {
  return deps.moduleAccessRepository.getAccessStatus(params.groupId, params.userId, params.module)
}
