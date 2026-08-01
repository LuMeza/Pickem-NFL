import type { GroupRepository } from '@/core/ports/GroupRepository'

export interface RemoveGroupMemberDeps {
  groupRepository: GroupRepository
}

export interface RemoveGroupMemberParams {
  groupId: string
  userId: string
}

/** Panel admin: remover miembro de un grupo — ver openspec/changes/base-plataforma specs/grupos-privados. */
export function removeGroupMember(deps: RemoveGroupMemberDeps, params: RemoveGroupMemberParams): Promise<void> {
  return deps.groupRepository.removeMember(params.groupId, params.userId)
}
