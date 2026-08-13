import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminUserSummary, AuthRepository, ProvisionalUserAccount } from '@/core/ports/AuthRepository'
import type { Profile } from '@/core/entities/profile'

/**
 * Ver openspec/changes/base-plataforma design.md, decision 3: `createUser`
 * invoca una Edge Function (la única que puede usar la Supabase Admin API);
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

  async resendWelcomeEmail(userId: string): Promise<ProvisionalUserAccount> {
    const { data, error } = await this.client.functions.invoke<ProvisionalUserAccount>('admin-resend-welcome', {
      body: { userId },
    })

    if (error || !data) {
      throw new Error(`No se pudo reenviar el correo de bienvenida: ${error?.message ?? 'respuesta vacia'}`)
    }

    return data
  }

  async listUsers(): Promise<AdminUserSummary[]> {
    const [profilesResult, adminsResult] = await Promise.all([
      this.client
        .from('profiles')
        .select('id, display_name, email, created_at')
        .order('created_at', { ascending: false }),
      this.client.from('platform_admins').select('user_id'),
    ])
    if (profilesResult.error) throw profilesResult.error
    if (adminsResult.error) throw adminsResult.error

    const adminIds = new Set((adminsResult.data ?? []).map((row) => row.user_id as string))

    return (profilesResult.data ?? []).map((row) => ({
      userId: row.id as string,
      displayName: row.display_name as string,
      email: row.email as string,
      createdAt: new Date(row.created_at as string),
      isAdmin: adminIds.has(row.id as string),
    }))
  }

  async updateUser(userId: string, displayName: string, email: string): Promise<void> {
    const { error } = await this.client.functions.invoke('admin-update-user', {
      body: { userId, displayName, email },
    })
    if (error) throw error
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.client.functions.invoke('admin-delete-user', {
      body: { userId },
    })
    if (error) throw error
  }

  async grantPlatformAdmin(userId: string): Promise<void> {
    const { error } = await this.client.rpc('grant_platform_admin', { p_user_id: userId })
    if (error) throw error
  }

  async revokePlatformAdmin(userId: string): Promise<void> {
    const { error } = await this.client.rpc('revoke_platform_admin', { p_user_id: userId })
    if (error) throw error
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
    if (!userId) throw new Error('No hay sesión activa para completar el cambio de contraseña')

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
    if (!userId) throw new Error('No hay sesión activa')

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
    if (!userId) throw new Error('No hay sesión activa')

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
