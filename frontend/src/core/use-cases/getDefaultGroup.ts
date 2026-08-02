import type { GroupRepository, GroupSummary } from '@/core/ports/GroupRepository'

export interface GetDefaultGroupDeps {
  groupRepository: GroupRepository
}

/**
 * Grupo único global (ver specs/grupos-privados actualizado): no hay flujo de
 * selección de grupo, siempre se opera sobre el único grupo existente.
 */
export async function getDefaultGroup(deps: GetDefaultGroupDeps): Promise<GroupSummary> {
  const groups = await deps.groupRepository.listGroups()
  const group = groups[0]
  if (!group) throw new Error('No existe el grupo de la plataforma todavía')
  return group
}
