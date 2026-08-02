import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useCheckPlatformAdmin } from '@/presentation/hooks/useCheckPlatformAdmin'

/**
 * Tarea 7.3: restringe el panel admin a usuarios en platform_admins. Es una
 * verificación de UX — la autorización real la impone RLS en cada operación.
 */
export function RequireAdmin() {
  const { status, data, run } = useCheckPlatformAdmin()

  useEffect(() => {
    run()
  }, [run])

  if (status === 'idle' || status === 'pending') {
    return <p>Verificando permisos...</p>
  }

  if (status === 'error' || !data) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
