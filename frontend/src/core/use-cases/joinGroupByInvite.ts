import type { GroupRepository } from '@/core/ports/GroupRepository'

export interface JoinGroupByInviteDeps {
  groupRepository: GroupRepository
}

export interface JoinGroupByInviteParams {
  code: string
}

/** Union a grupo por link/codigo — ver openspec/changes/base-plataforma specs/grupos-privados. */
export function joinGroupByInvite(
  deps: JoinGroupByInviteDeps,
  params: JoinGroupByInviteParams,
): Promise<{ groupId: string }> {
  return deps.groupRepository.joinGroupByCode(params.code)
}
