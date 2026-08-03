import { useCallback, useEffect } from 'react'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useRecalculateSurvivorState } from '@/presentation/hooks/useRecalculateSurvivorState'
import { useListSurvivorLifeRequests } from '@/presentation/hooks/useListSurvivorLifeRequests'
import { useResolveSurvivorLifeRequest } from '@/presentation/hooks/useResolveSurvivorLifeRequest'
import { Icon } from '@/presentation/components/Icon/Icon'
import type { SurvivorLifeRequestDecision } from '@/core/ports'
import styles from './ModuleAccessRequestsPage.module.css'

/** Panel admin, plan B (modulo-survivor design.md decision 4): el recalculo corre solo al cargarse un resultado; este boton lo dispara a mano por si eso no paso. */
export function AdminSurvivorPage() {
  const { data: group } = useSession().group
  const { status, error, run: recalculate } = useRecalculateSurvivorState()
  const { data: lifeRequests, run: loadLifeRequests } = useListSurvivorLifeRequests()
  const { run: resolveLifeRequest } = useResolveSurvivorLifeRequest()

  const reloadLifeRequests = useCallback(() => {
    if (group) loadLifeRequests({ groupId: group.id })
  }, [group, loadLifeRequests])

  useEffect(() => {
    reloadLifeRequests()
  }, [reloadLifeRequests])

  async function handleResolve(requestId: string, decision: SurvivorLifeRequestDecision) {
    await resolveLifeRequest({ requestId, decision })
    reloadLifeRequests()
  }

  const pending = (lifeRequests ?? []).filter((request) => request.status === 'solicitado')
  const resolved = (lifeRequests ?? []).filter((request) => request.status !== 'solicitado')

  return (
    <section>
      <span className="kicker">
        <Icon name="refresh" size={13} /> Survivor
      </span>
      <h1 className="text-display-lg">Recalcular Survivor</h1>
      <p className="text-body-sm text-muted">
        El estado de Survivor (vidas, eliminaciones, podio) se recalcula solo cada vez que se carga un resultado —
        a mano o vía la sincronización con ESPN. Usá este botón como plan B si el recálculo automático no corrió.
      </p>

      {group && (
        <button type="button" onClick={() => recalculate({ groupId: group.id })} disabled={status === 'pending'}>
          {status === 'pending' ? 'Recalculando...' : 'Recalcular ahora'}
        </button>
      )}

      {status === 'success' && <p className="text-body-sm text-muted">Listo, estado actualizado.</p>}
      {error && <p role="alert">No se pudo recalcular: {error.message}</p>}

      <div className={styles.section}>
        <h2 className={`text-display-sm ${styles.sectionTitle}`}>Solicitudes de vida</h2>
        <p className="text-body-sm text-muted">
          Cada vida extra (design.md decision 7) se otorga solo si la aprobás acá — mientras esté pendiente, quien la
          pidió puede seguir pickeando de forma provisoria.
        </p>

        {pending.length === 0 && <p className="text-body-sm text-muted">Sin solicitudes pendientes.</p>}
        <ul className={styles.list}>
          {pending.map((request) => (
            <li key={request.id} className={`${styles.row} glass-surface`}>
              <span className={styles.info}>
                <span className={styles.name}>
                  {request.displayName} — vida {request.lifeNumber}
                </span>
              </span>
              <span className={styles.actions}>
                <button type="button" onClick={() => handleResolve(request.id, 'aprobado')}>
                  Aprobar
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => handleResolve(request.id, 'rechazado')}
                >
                  Rechazar
                </button>
              </span>
            </li>
          ))}
        </ul>

        {resolved.length > 0 && (
          <ul className={styles.list}>
            {resolved.map((request) => (
              <li key={request.id} className={`${styles.row} glass-surface`}>
                <span className={styles.info}>
                  <span className={styles.name}>
                    {request.displayName} — vida {request.lifeNumber}
                  </span>
                </span>
                <span
                  className={`${styles.statusPill} ${request.status === 'aprobado' ? styles.statusAprobado : styles.statusRechazado}`}
                >
                  {request.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
