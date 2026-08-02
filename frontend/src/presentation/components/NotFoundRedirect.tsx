import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useSessionStatus } from '@/presentation/hooks/useSessionStatus'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'

/**
 * Ruta catch-all ("*"). Si la sesión no es válida redirige a /login en vez
 * de mostrar una página rota; si hay sesión activa, muestra que la ruta no
 * existe con un link de vuelta al inicio.
 */
export function NotFoundRedirect() {
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

  return (
    <EmptyState
      message={EMPTY_STATE_COPY.pageNotFound}
      action={<Link to="/">Volver al inicio</Link>}
    />
  )
}
