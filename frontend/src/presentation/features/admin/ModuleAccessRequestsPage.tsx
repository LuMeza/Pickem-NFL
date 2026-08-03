import { useCallback, useEffect, useState } from 'react'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListModuleAccessRequests } from '@/presentation/hooks/useListModuleAccessRequests'
import { useResolveModuleAccessRequest } from '@/presentation/hooks/useResolveModuleAccessRequest'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import styles from './ModuleAccessRequestsPage.module.css'

/** Tarea 5.6 (base-plataforma): aprobar/rechazar solicitudes de acceso a módulo. */
export function ModuleAccessRequestsPage() {
  const { data: group } = useSession().group
  const { status, data: requests, error, run: loadRequests } = useListModuleAccessRequests()
  const { error: resolveError, run: resolveRequest } = useResolveModuleAccessRequest()
  const [actioningKey, setActioningKey] = useState<string | null>(null)

  const reload = useCallback(() => {
    if (group) loadRequests({ groupId: group.id })
  }, [group, loadRequests])

  useEffect(() => {
    reload()
  }, [reload])

  async function handleResolve(userId: string, module: 'pickem_semanal' | 'survivor' | 'playoffs', decision: 'aprobado' | 'rechazado') {
    if (!group) return
    const key = `${userId}-${module}`
    setActioningKey(key)
    try {
      await resolveRequest({ groupId: group.id, userId, module, decision })
      reload()
    } finally {
      setActioningKey(null)
    }
  }

  const pending = requests?.filter((request) => request.status === 'solicitado') ?? []
  const resolved = requests?.filter((request) => request.status !== 'solicitado') ?? []

  return (
    <section>
      <span className="kicker">
        <Icon name="ticket" size={13} /> Aprobaciones
      </span>
      <h1 className="text-display-lg">Solicitudes de acceso</h1>
      {status === 'pending' && <LoadingSpinner variant="inline" />}
      {error && <p role="alert">No se pudieron cargar las solicitudes.</p>}
      {resolveError && <p role="alert">No se pudo resolver la solicitud: {resolveError.message}</p>}

      <div className={styles.section}>
        <h2 className={`text-display-sm ${styles.sectionTitle}`}>Pendientes</h2>
        {pending.length === 0 && <p className="text-body-sm text-muted">No hay solicitudes pendientes.</p>}
        <ul className={styles.list}>
          {pending.map((request) => {
            const key = `${request.userId}-${request.module}`
            const busy = actioningKey === key
            return (
              <li key={key} className={`${styles.row} glass-surface`}>
                <span className={styles.info}>
                  <span className={styles.name}>{request.displayName}</span>
                  <span className={styles.module}>{request.module}</span>
                </span>
                <span className={styles.actions}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleResolve(request.userId, request.module, 'aprobado')}
                  >
                    {busy ? 'Procesando...' : 'Aprobar'}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={busy}
                    onClick={() => handleResolve(request.userId, request.module, 'rechazado')}
                  >
                    Rechazar
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {resolved.length > 0 && (
        <div className={styles.section}>
          <h2 className={`text-display-sm ${styles.sectionTitle}`}>Resueltas</h2>
          <ul className={styles.list}>
            {resolved.map((request) => (
              <li key={`${request.userId}-${request.module}`} className={`${styles.row} glass-surface`}>
                <span className={styles.info}>
                  <span className={styles.name}>{request.displayName}</span>
                  <span className={styles.module}>{request.module}</span>
                </span>
                <span
                  className={`${styles.statusPill} ${request.status === 'aprobado' ? styles.statusAprobado : styles.statusRechazado}`}
                >
                  {request.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
