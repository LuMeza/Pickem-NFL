export interface GroupMember {
  userId: string
  displayName: string
  joinedAt: Date
}

export interface GroupSummary {
  id: string
  name: string
}

/**
 * Ver openspec/changes/base-plataforma specs/grupos-privados (actualizado:
 * grupo unico global, sin flujo de creacion/invitacion — todo usuario queda
 * agregado automaticamente al darse de alta, ver admin-create-user).
 * `listGroups` siempre retorna ese unico grupo; se mantiene como lista (no
 * `getDefaultGroup`) por si en el futuro se reintroduce mas de un grupo.
 */
export interface GroupRepository {
  listMembers(groupId: string): Promise<GroupMember[]>
  removeMember(groupId: string, userId: string): Promise<void>
  listGroups(): Promise<GroupSummary[]>
}
