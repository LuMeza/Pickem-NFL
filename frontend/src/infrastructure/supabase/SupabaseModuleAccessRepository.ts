import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  GameModule,
  ModuleAccessRepository,
  ModuleAccessRequest,
  ModuleAccessStatus,
} from '@/core/ports/ModuleAccessRepository'

export class SupabaseModuleAccessRepository implements ModuleAccessRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async requestAccess(groupId: string, userId: string, module: GameModule): Promise<void> {
    const { error } = await this.client
      .from('module_access')
      .upsert({ group_id: groupId, user_id: userId, module, status: 'solicitado' })
    if (error) throw error
  }

  async approveAccess(groupId: string, userId: string, module: GameModule): Promise<void> {
    await this.setStatus(groupId, userId, module, 'aprobado')
  }

  async rejectAccess(groupId: string, userId: string, module: GameModule): Promise<void> {
    await this.setStatus(groupId, userId, module, 'rechazado')
  }

  async getAccessStatus(groupId: string, userId: string, module: GameModule): Promise<ModuleAccessStatus | null> {
    const { data, error } = await this.client
      .from('module_access')
      .select('status')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('module', module)
      .maybeSingle()
    if (error) throw error

    return (data?.status as ModuleAccessStatus | undefined) ?? null
  }

  async listRequests(groupId: string): Promise<ModuleAccessRequest[]> {
    const { data, error } = await this.client
      .from('module_access')
      .select('user_id, module, status, profiles(display_name)')
      .eq('group_id', groupId)
      .order('requested_at')
    if (error) throw error

    return (data ?? []).map((row) => {
      const profile = row.profiles as unknown as { display_name: string } | { display_name: string }[] | null
      const displayName = Array.isArray(profile) ? profile[0]?.display_name : profile?.display_name

      return {
        userId: row.user_id as string,
        displayName: displayName ?? '',
        module: row.module as GameModule,
        status: row.status as ModuleAccessStatus,
      }
    })
  }

  private async setStatus(
    groupId: string,
    userId: string,
    module: GameModule,
    status: ModuleAccessStatus,
  ): Promise<void> {
    const { error } = await this.client
      .from('module_access')
      .update({ status })
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('module', module)
    if (error) throw error
  }
}
