import { useCallback, useEffect, useMemo } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useSignOut } from '@/presentation/hooks/useSignOut'
import { useCheckPlatformAdmin } from '@/presentation/hooks/useCheckPlatformAdmin'
import { AppShell } from '@/presentation/components/AppShell/AppShell'
import type { NavItem } from '@/presentation/components/AppShell/NavBar'

const BASE_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: 'home' },
  { to: '/calendario', label: 'Calendario', icon: 'calendar' },
  { to: '/teams', label: 'Equipos', icon: 'football' },
  { to: '/weeks', label: 'Semanas', icon: 'calendar' },
  { to: '/profile', label: 'Perfil', icon: 'user' },
]

const ADMIN_NAV_ITEM: NavItem = { to: '/admin', label: 'Admin', icon: 'gear' }

/** Layout autenticado: usa el AppShell del sistema de diseno (ver sistema-diseno-ui). */
export function AppLayout() {
  const navigate = useNavigate()
  const { run: doSignOut } = useSignOut()
  const { status: adminStatus, data: isPlatformAdmin, run: checkPlatformAdmin } = useCheckPlatformAdmin()

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

  return (
    <AppShell navItems={navItems} header={{ onSignOut: handleSignOut }}>
      <Outlet />
    </AppShell>
  )
}
