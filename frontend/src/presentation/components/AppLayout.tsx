import { useCallback, useEffect, useMemo } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useSignOut } from '@/presentation/hooks/useSignOut'
import { useCheckPlatformAdmin } from '@/presentation/hooks/useCheckPlatformAdmin'
import { SessionProvider } from '@/presentation/hooks/SessionProvider'
import { useSession } from '@/presentation/hooks/SessionContext'
import { pickDefaultWeek } from '@/core/rules/pickDefaultWeek'
import { weeklyPickGroupDeadline } from '@/core/rules/weeklyPickGroupDeadline'
import { weekLabel as formatWeekLabel } from '@/presentation/features/pickem/weekLabel'
import { AppShell } from '@/presentation/components/AppShell/AppShell'
import type { NavItem } from '@/presentation/components/AppShell/NavBar'

const BASE_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: 'home' },
  { to: '/calendario', label: 'Calendario', icon: 'calendar' },
  { to: '/teams', label: 'Equipos', icon: 'football' },
  { to: '/pickem', label: 'Pickem', icon: 'trophy' },
  { to: '/profile', label: 'Perfil', icon: 'user' },
]

const ADMIN_NAV_ITEM: NavItem = { to: '/admin', label: 'Admin', icon: 'gear' }

function AuthenticatedShell() {
  const navigate = useNavigate()
  const { run: doSignOut } = useSignOut()
  const { status: adminStatus, data: isPlatformAdmin, run: checkPlatformAdmin } = useCheckPlatformAdmin()
  const { group, weeks, games } = useSession()

  useEffect(() => {
    checkPlatformAdmin()
  }, [checkPlatformAdmin])

  const handleSignOut = useCallback(async () => {
    await doSignOut()
    navigate('/login', { replace: true })
  }, [doSignOut, navigate])

  const navItems = useMemo(
    () => (adminStatus === 'success' && isPlatformAdmin ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM] : BASE_NAV_ITEMS),
    [adminStatus, isPlatformAdmin],
  )

  const activeWeek = useMemo(() => {
    if (!weeks.data || weeks.data.length === 0) return null
    return pickDefaultWeek(weeks.data, games.data ?? [], new Date())
  }, [weeks.data, games.data])

  // La Pickem Semanal cierra en dos bloques por semana (entre semana y fin de
  // semana, ver core/rules/weeklyPickGroupDeadline) — el header muestra la
  // cuenta regresiva al proximo cierre que todavia no paso, no solo al
  // primer kickoff de la semana. Survivor tiene su propio countdown en su
  // pagina (SurvivorPickPage), asi que este reloj compartido puede seguir el
  // criterio de la Pickem Semanal sin desinformar a los jugadores de Survivor.
  const countdownTo = useMemo(() => {
    if (!activeWeek || !games.data) return null
    const gamesInWeek = games.data.filter((game) => game.weekId === activeWeek.id)
    if (gamesInWeek.length === 0) return null
    const now = Date.now()
    const upcomingDeadlines = gamesInWeek
      .map((game) => weeklyPickGroupDeadline(gamesInWeek, game.kickoffAt))
      .filter((deadline): deadline is Date => deadline !== null && deadline.getTime() > now)
    if (upcomingDeadlines.length === 0) return null
    return new Date(Math.min(...upcomingDeadlines.map((deadline) => deadline.getTime())))
  }, [activeWeek, games.data])

  return (
    <AppShell
      navItems={navItems}
      header={{
        groupName: group.data?.name,
        weekLabel: activeWeek ? formatWeekLabel(activeWeek) : undefined,
        countdownTo,
        onSignOut: handleSignOut,
      }}
    >
      <Outlet />
    </AppShell>
  )
}

/** Layout autenticado: usa el AppShell del sistema de diseño (ver sistema-diseno-ui). */
export function AppLayout() {
  return (
    <SessionProvider>
      <AuthenticatedShell />
    </SessionProvider>
  )
}
