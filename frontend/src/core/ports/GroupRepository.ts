export interface GroupMember {
  userId: string
  displayName: string
  joinedAt: Date
}

/**
 * Ver openspec/changes/base-plataforma specs/grupos-privados.
 * Crear grupo, regenerar/leer codigo de invitacion y administrar miembros
 * son operaciones exclusivas del administrador de plataforma (impuesto por
 * RLS; el adapter no duplica esa validacion).
 */
export interface GroupRepository {
  createGroup(name: string): Promise<{ groupId: string; inviteCode: string }>
  getInviteCode(groupId: string): Promise<string>
  regenerateInviteCode(groupId: string): Promise<string>
  joinGroupByCode(code: string): Promise<{ groupId: string }>
  listMembers(groupId: string): Promise<GroupMember[]>
  removeMember(groupId: string, userId: string): Promise<void>
}
