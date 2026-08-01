import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthRepository, ProvisionalUserAccount } from '@/core/ports/AuthRepository'
import type { Profile } from '@/core/entities/profile'

/**
 * Ver openspec/changes/base-plataforma design.md, decision 3: `createUser`
 * invoca una Edge Function (la unica que puede usar la Supabase Admin API);
 * este adapter nunca usa la service role key directamente.
 */
export class SupabaseAuthRepository implements AuthRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async createUser(email: string, displayName: string): Promise<ProvisionalUserAccount> {
    const { data, error } = await this.client.functions.invoke<ProvisionalUserAccount>('admin-create-user', {
      body: { email, displayName },
    })

    if (error || !data) {
      throw new Error(`No se pudo dar de alta al usuario: ${error?.message ?? 'respuesta vacia'}`)
    }

    return data
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.client.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut()
    if (error) throw error
  }

  async changePassword(newPassword: string): Promise<void> {
    const { error: updateError } = await this.client.auth.updateUser({ password: newPassword })
    if (updateError) throw updateError

    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('No hay sesion activa para completar el cambio de contrasena')

    const { error: profileError } = await this.client
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', userId)
    if (profileError) throw profileError
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  async getCurrentUserId(): Promise<string | null> {
    const { data, error } = await this.client.auth.getUser()
    if (error) throw error
    return data.user?.id ?? null
  }

  async mustChangePassword(): Promise<boolean> {
    const userId = await this.getCurrentUserId()
    if (!userId) return false

    const { data, error } = await this.client
      .from('profiles')
      .select('must_change_password')
      .eq('id', userId)
      .single()
    if (error) throw error

    return Boolean(data?.must_change_password)
  }

  async getProfile(): Promise<Profile> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('No hay sesion activa')

    const { data, error } = await this.client
      .from('profiles')
      .select('id, display_name, email')
      .eq('id', userId)
      .single()
    if (error) throw error

    return { userId: data.id as string, displayName: data.display_name as string, email: data.email as string }
  }

  async updateDisplayName(displayName: string): Promise<void> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('No hay sesion activa')

    const { error } = await this.client.from('profiles').update({ display_name: displayName }).eq('id', userId)
    if (error) throw error
  }

  async isPlatformAdmin(): Promise<boolean> {
    const userId = await this.getCurrentUserId()
    if (!userId) return false

    const { data, error } = await this.client
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error

    return data !== null
  }
}
