import { createContext, useContext } from 'react'
import type { Profile } from '@/core/entities/profile'
import type { GroupSummary } from '@/core/ports/GroupRepository'
import type { Game, Team, Week } from '@/core/entities/catalog'

export interface SessionResource<T> {
  status: 'idle' | 'pending' | 'success' | 'error'
  data: T | null
  error: Error | null
  reload: () => void
}

export interface Session {
  profile: SessionResource<Profile>
  group: SessionResource<GroupSummary>
  weeks: SessionResource<Week[]>
  teams: SessionResource<Team[]>
  games: SessionResource<Game[]>
}

/**
 * Datos de sesión que casi no cambian mientras el usuario navega (perfil,
 * grupo único, catálogo de semanas/equipos/partidos) — ver <SessionProvider>,
 * montado en AppLayout, en vez de que cada página los vuelva a pedir a
 * Supabase en cada navegación (ver auditoria de redundancia de llamadas).
 */
export const SessionContext = createContext<Session | null>(null)

/** Sesión compartida (perfil, grupo, semanas, equipos, partidos). */
export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) {
    throw new Error('useSession debe usarse dentro de <SessionProvider>')
  }
  return session
}
