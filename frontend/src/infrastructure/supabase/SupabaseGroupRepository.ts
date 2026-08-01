import type { SupabaseClient } from '@supabase/supabase-js'
import type { GroupMember, GroupRepository, GroupSummary } from '@/core/ports/GroupRepository'

export class SupabaseGroupRepository implements GroupRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
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

  async listGroups(): Promise<GroupSummary[]> {
    const { data, error } = await this.client.from('groups').select('id, name').order('name')
    if (error) throw error

    return (data ?? []).map((row) => ({ id: row.id as string, name: row.name as string }))
  }
}
