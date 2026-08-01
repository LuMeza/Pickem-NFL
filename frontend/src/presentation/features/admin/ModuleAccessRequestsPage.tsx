import { useCallback, useEffect } from 'react'
import { useDefaultGroup } from '@/presentation/hooks/useDefaultGroup'
import { useListModuleAccessRequests } from '@/presentation/hooks/useListModuleAccessRequests'
import { useResolveModuleAccessRequest } from '@/presentation/hooks/useResolveModuleAccessRequest'
import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './ModuleAccessRequestsPage.module.css'

/** Tarea 5.6 (base-plataforma): aprobar/rechazar solicitudes de acceso a modulo. */
export function ModuleAccessRequestsPage() {
  const { data: group, run: loadGroup } = useDefaultGroup()
  const { status, data: requests, error, run: loadRequests } = useListModuleAccessRequests()
  const { run: resolveRequest } = useResolveModuleAccessRequest()

  useEffect(() => {
    loadGroup()
  }, [loadGroup])

  const reload = useCallback(() => {
    if (group) loadRequests({ groupId: group.id })
  }, [group, loadRequests])

  useEffect(() => {
    reload()
  }, [reload])

  async function handleResolve(userId: string, module: 'pickem_semanal' | 'survivor' | 'playoffs', decision: 'aprobado' | 'rechazado') {
    if (!group) return
    await resolveRequest({ groupId: group.id, userId, module, decision })
    reload()
  }

  const pending = requests?.filter((request) => request.status === 'solicitado') ?? []
  const resolved = requests?.filter((request) => request.status !== 'solicitado') ?? []

  return (
    <section>
      <span className="kicker">
        <Icon name="ticket" size={13} /> Aprobaciones
      </span>
      <h1 className="text-display-lg">Solicitudes de acceso</h1>
      {status === 'pending' && <p>Cargando...</p>}
      {error && <p role="alert">No se pudieron cargar las solicitudes.</p>}

      <div className={styles.section}>
        <h2 className={`text-display-sm ${styles.sectionTitle}`}>Pendientes</h2>
        {pending.length === 0 && <p className="text-body-sm text-muted">No hay solicitudes pendientes.</p>}
        <ul className={styles.list}>
          {pending.map((request) => (
            <li key={`${request.userId}-${request.module}`} className={`${styles.row} glass-surface`}>
              <span className={styles.info}>
                <span className={styles.name}>{request.displayName}</span>
                <span className={styles.module}>{request.module}</span>
              </span>
              <span className={styles.actions}>
                <button type="button" onClick={() => handleResolve(request.userId, request.module, 'aprobado')}>
                  Aprobar
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => handleResolve(request.userId, request.module, 'rechazado')}
                >
                  Rechazar
                </button>
              </span>
            </li>
          ))}
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
