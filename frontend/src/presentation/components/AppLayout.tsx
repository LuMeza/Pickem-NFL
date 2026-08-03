import { useCallback, useEffect, useMemo } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useSignOut } from '@/presentation/hooks/useSignOut'
import { useCheckPlatformAdmin } from '@/presentation/hooks/useCheckPlatformAdmin'
import { SessionProvider } from '@/presentation/hooks/SessionProvider'
import { useSession } from '@/presentation/hooks/SessionContext'
import { pickDefaultWeek } from '@/core/rules/pickDefaultWeek'
import { isWeekAccessLocked } from '@/core/rules/isWeekAccessLocked'
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

  const countdownTo = useMemo(() => {
    if (!activeWeek || !games.data) return null
    const gamesInWeek = games.data.filter((game) => game.weekId === activeWeek.id)
    if (gamesInWeek.length === 0 || isWeekAccessLocked(gamesInWeek, new Date())) return null
    return new Date(Math.min(...gamesInWeek.map((game) => game.kickoffAt.getTime())))
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
