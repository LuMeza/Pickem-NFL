import type { GroupMember, GroupRepository } from '@/core/ports/GroupRepository'

export interface ListGroupMembersDeps {
  groupRepository: GroupRepository
}

export interface ListGroupMembersParams {
  groupId: string
}

/** Panel admin: listar miembros de un grupo — ver openspec/changes/base-plataforma specs/grupos-privados. */
export function listGroupMembers(deps: ListGroupMembersDeps, params: ListGroupMembersParams): Promise<GroupMember[]> {
  return deps.groupRepository.listMembers(params.groupId)
}
