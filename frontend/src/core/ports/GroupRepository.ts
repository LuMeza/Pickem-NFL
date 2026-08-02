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
 * grupo único global, sin flujo de creación/invitación — todo usuario queda
 * agregado automáticamente al darse de alta, ver admin-create-user).
 * `listGroups` siempre retorna ese único grupo; se mantiene como lista (no
 * `getDefaultGroup`) por si en el futuro se reintroduce más de un grupo.
 */
export interface GroupRepository {
  listMembers(groupId: string): Promise<GroupMember[]>
  removeMember(groupId: string, userId: string): Promise<void>
  listGroups(): Promise<GroupSummary[]>
}
