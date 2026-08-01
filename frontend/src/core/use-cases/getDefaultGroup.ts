import type { GroupRepository, GroupSummary } from '@/core/ports/GroupRepository'

export interface GetDefaultGroupDeps {
  groupRepository: GroupRepository
}

/**
 * Grupo unico global (ver specs/grupos-privados actualizado): no hay flujo de
 * seleccion de grupo, siempre se opera sobre el unico grupo existente.
 */
export async function getDefaultGroup(deps: GetDefaultGroupDeps): Promise<GroupSummary> {
  const groups = await deps.groupRepository.listGroups()
  const group = groups[0]
  if (!group) throw new Error('No existe el grupo de la plataforma todavia')
  return group
}
