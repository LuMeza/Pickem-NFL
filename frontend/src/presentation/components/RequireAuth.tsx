import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useSessionStatus } from '@/presentation/hooks/useSessionStatus'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'

/**
 * Tarea 4.6: redirige a /login si no hay sesion activa. No exige que el
 * cambio de contrasena obligatorio ya se haya hecho (lo usa /change-password,
 * que debe ser alcanzable incluso con must_change_password = true).
 */
export function RequireAuth() {
  const { status, data, run } = useSessionStatus()

  useEffect(() => {
    run()
  }, [run])

  if (status === 'idle' || status === 'pending') {
    return <LoadingSpinner label="Cargando sesion..." />
  }

  if (status === 'error' || !data?.userId) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
