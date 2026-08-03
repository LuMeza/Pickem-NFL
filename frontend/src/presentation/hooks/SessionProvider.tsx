import { useEffect, type ReactNode } from 'react'
import { useGetProfile } from './useGetProfile'
import { useDefaultGroup } from './useDefaultGroup'
import { useListWeeks } from './useListWeeks'
import { useListTeams } from './useListTeams'
import { useListAllGames } from './useListAllGames'
import { SessionContext, type Session } from './SessionContext'

/**
 * Carga una sola vez el perfil, el grupo único, y el catálogo de
 * semanas/equipos/partidos — montado en AppLayout, por encima de todas las
 * pantallas autenticadas. Los `reload()` existen para las pocas pantallas
 * que mutan estos datos (ej. renombrarse en el perfil, sincronizar calendario
 * con ESPN desde el panel admin).
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const profile = useGetProfile()
  const group = useDefaultGroup()
  const weeks = useListWeeks()
  const teams = useListTeams()
  const games = useListAllGames()

  const { run: loadProfile } = profile
  const { run: loadGroup } = group
  const { run: loadWeeks } = weeks
  const { run: loadTeams } = teams
  const { run: loadGames } = games

  useEffect(() => {
    loadProfile()
    loadGroup()
    loadWeeks()
    loadTeams()
    loadGames()
  }, [loadProfile, loadGroup, loadWeeks, loadTeams, loadGames])

  const session: Session = {
    profile: { status: profile.status, data: profile.data, error: profile.error, reload: () => profile.run() },
    group: { status: group.status, data: group.data, error: group.error, reload: () => group.run() },
    weeks: { status: weeks.status, data: weeks.data, error: weeks.error, reload: () => weeks.run() },
    teams: { status: teams.status, data: teams.data, error: teams.error, reload: () => teams.run() },
    games: { status: games.status, data: games.data, error: games.error, reload: () => games.run() },
  }

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
