import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useSessionStatus } from '@/presentation/hooks/useSessionStatus'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'

/**
 * Tarea 4.6: redirige a /login si no hay sesión, y a /change-password si el
 * cambio de contraseña obligatorio sigue pendiente (bloquea el resto de la
 * app hasta completarlo — ver specs/auth-usuarios).
 */
export function RequireActiveSession() {
  const { status, data, run } = useSessionStatus()

  useEffect(() => {
    run()
  }, [run])

  if (status === 'idle' || status === 'pending') {
    return <LoadingSpinner label="Cargando sesión..." />
  }

  if (status === 'error' || !data?.userId) {
    return <Navigate to="/login" replace />
  }

  if (data.mustChangePassword) {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}
