import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useCheckPlatformAdmin } from '@/presentation/hooks/useCheckPlatformAdmin'

/**
 * Tarea 7.3: restringe el panel admin a usuarios en platform_admins. Es una
 * verificacion de UX — la autorizacion real la impone RLS en cada operacion.
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
