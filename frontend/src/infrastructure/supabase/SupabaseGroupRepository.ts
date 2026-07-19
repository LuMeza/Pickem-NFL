import type { SupabaseClient } from '@supabase/supabase-js'
import type { GroupMember, GroupRepository } from '@/core/ports/GroupRepository'

/**
 * `createGroup`, `regenerateInviteCode` y `joinGroupByCode` se apoyan en
 * funciones RPC (SECURITY DEFINER) de Postgres en vez de construir la logica
 * de generacion/validacion de codigo en el cliente — ver
 * openspec/changes/base-plataforma design.md, decision 5.
 */
export class SupabaseGroupRepository implements GroupRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async createGroup(name: string): Promise<{ groupId: string; inviteCode: string }> {
    const { data, error } = await this.client
      .rpc('create_group', { group_name: name })
      .single<{ group_id: string; invite_code: string }>()
    if (error || !data) throw error ?? new Error('No se pudo crear el grupo')

    return { groupId: data.group_id, inviteCode: data.invite_code }
  }

  async getInviteCode(groupId: string): Promise<string> {
    const { data, error } = await this.client
      .from('group_invites')
      .select('code')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .single()
    if (error) throw error

    return data.code as string
  }

  async regenerateInviteCode(groupId: string): Promise<string> {
    const { data, error } = await this.client
      .rpc('regenerate_invite_code', { p_group_id: groupId })
      .single<{ code: string }>()
    if (error || !data) throw error ?? new Error('No se pudo regenerar el codigo de invitacion')

    return data.code
  }

  async joinGroupByCode(code: string): Promise<{ groupId: string }> {
    const { data, error } = await this.client.rpc('join_group_by_code', { p_code: code }).single<{ group_id: string }>()
    if (error || !data) throw error ?? new Error('Codigo de invitacion invalido')

    return { groupId: data.group_id }
  }

  async listMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await this.client
      .from('group_members')
      .select('user_id, joined_at, profiles(display_name)')
      .eq('group_id', groupId)
    if (error) throw error

    return (data ?? []).map((row) => {
      const profile = row.profiles as unknown as { display_name: string } | { display_name: string }[] | null
      const displayName = Array.isArray(profile) ? profile[0]?.display_name : profile?.display_name

      return {
        userId: row.user_id as string,
        displayName: displayName ?? '',
        joinedAt: new Date(row.joined_at as string),
      }
    })
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)
    if (error) throw error
  }
}
