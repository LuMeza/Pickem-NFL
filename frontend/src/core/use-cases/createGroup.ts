import type { GroupRepository } from '@/core/ports/GroupRepository'

export interface CreateGroupDeps {
  groupRepository: GroupRepository
}

export interface CreateGroupParams {
  name: string
}

/** Creacion de grupo por el administrador — ver openspec/changes/base-plataforma specs/grupos-privados. */
export function createGroup(
  deps: CreateGroupDeps,
  params: CreateGroupParams,
): Promise<{ groupId: string; inviteCode: string }> {
  return deps.groupRepository.createGroup(params.name)
}
