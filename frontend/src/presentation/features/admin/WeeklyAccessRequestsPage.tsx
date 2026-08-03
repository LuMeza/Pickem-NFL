import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListWeeklyAccessRequests } from '@/presentation/hooks/useListWeeklyAccessRequests'
import { useResolveWeeklyAccessRequest } from '@/presentation/hooks/useResolveWeeklyAccessRequest'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import type { Week } from '@/core/entities/catalog'
import type { WeeklyAccessRequest } from '@/core/ports/WeeklyAccessRepository'
import { isWeekAccessLocked } from '@/core/rules/isWeekAccessLocked'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import styles from './ModuleAccessRequestsPage.module.css'

interface WeekGroup {
  week: Week | undefined
  weekId: string
  requests: WeeklyAccessRequest[]
}

function groupByWeek(requests: WeeklyAccessRequest[], weeks: Week[]): WeekGroup[] {
  const byWeek = new Map<string, WeeklyAccessRequest[]>()
  for (const request of requests) {
    const bucket = byWeek.get(request.weekId)
    if (bucket) bucket.push(request)
    else byWeek.set(request.weekId, [request])
  }
  const weekById = new Map(weeks.map((week) => [week.id, week]))
  return Array.from(byWeek.entries())
    .map(([weekId, weekRequests]) => ({ weekId, week: weekById.get(weekId), requests: weekRequests }))
    .sort((a, b) => (a.week?.number ?? 0) - (b.week?.number ?? 0))
}

function WeekGroupSection({
  weekId,
  week,
  requests: weekRequests,
  actioningKey,
  onResolve,
}: {
  weekId: string
  week: Week | undefined
  requests: WeeklyAccessRequest[]
  actioningKey: string | null
  onResolve: (userId: string, weekId: string, decision: 'aprobado' | 'rechazado') => void
}) {
  const { data: games, run: loadGames } = useListGamesForWeek()

  useEffect(() => {
    loadGames({ weekId })
  }, [weekId, loadGames])

  const locked = isWeekAccessLocked(games ?? [], new Date())
  const pending = weekRequests.filter((request) => request.status === 'solicitado')
  const resolved = weekRequests.filter((request) => request.status !== 'solicitado')

  return (
    <div className={styles.section}>
      <h2 className={`text-display-sm ${styles.sectionTitle}`}>{week ? weekLabel(week) : weekId}</h2>

      {locked && pending.length > 0 && (
        <p className="text-body-sm text-muted">
          Ya inicio el primer partido de esta semana — estas solicitudes ya no se pueden resolver.
        </p>
      )}
      {pending.length === 0 && <p className="text-body-sm text-muted">Sin solicitudes pendientes.</p>}
      <ul className={styles.list}>
        {pending.map((request) => {
          const key = `${weekId}-${request.userId}`
          const busy = actioningKey === key
          return (
            <li key={request.userId} className={`${styles.row} glass-surface`}>
              <span className={styles.info}>
                <span className={styles.name}>{request.displayName}</span>
              </span>
              <span className={styles.actions}>
                <button
                  type="button"
                  disabled={locked || busy}
                  onClick={() => onResolve(request.userId, weekId, 'aprobado')}
                >
                  {busy ? 'Procesando...' : 'Aprobar'}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={locked || busy}
                  onClick={() => onResolve(request.userId, weekId, 'rechazado')}
                >
                  Rechazar
                </button>
              </span>
            </li>
          )
        })}
      </ul>

      {resolved.length > 0 && (
        <ul className={styles.list}>
          {resolved.map((request) => (
            <li key={request.userId} className={`${styles.row} glass-surface`}>
              <span className={styles.info}>
                <span className={styles.name}>{request.displayName}</span>
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
  )
}

/** Tarea 2.3 (modulo-pickem-semanal): aprobar/rechazar solicitudes de acceso semanal, agrupadas por semana. */
export function WeeklyAccessRequestsPage() {
  const { data: group } = useSession().group
  const { data: weeks } = useSession().weeks
  const { status, data: requests, error, run: loadRequests } = useListWeeklyAccessRequests()
  const { error: resolveError, run: resolveRequest } = useResolveWeeklyAccessRequest()
  const [actioningKey, setActioningKey] = useState<string | null>(null)

  const reload = useCallback(() => {
    if (group) loadRequests({ groupId: group.id })
  }, [group, loadRequests])

  useEffect(() => {
    reload()
  }, [reload])

  async function handleResolve(userId: string, weekId: string, decision: 'aprobado' | 'rechazado') {
    if (!group) return
    const key = `${weekId}-${userId}`
    setActioningKey(key)
    try {
      await resolveRequest({ groupId: group.id, userId, weekId, decision })
      reload()
    } finally {
      setActioningKey(null)
    }
  }

  const groups = useMemo(() => groupByWeek(requests ?? [], weeks ?? []), [requests, weeks])

  return (
    <section>
      <span className="kicker">
        <Icon name="ticket" size={13} /> Aprobaciones
      </span>
      <h1 className="text-display-lg">Solicitudes de acceso semanal</h1>
      {status === 'pending' && <LoadingSpinner variant="inline" />}
      {error && <p role="alert">No se pudieron cargar las solicitudes.</p>}
      {resolveError && <p role="alert">No se pudo resolver la solicitud: {resolveError.message}</p>}
      {requests && requests.length === 0 && <p className="text-body-sm text-muted">No hay solicitudes todavía.</p>}

      {groups.map(({ weekId, week, requests: weekRequests }) => (
        <WeekGroupSection
          key={weekId}
          weekId={weekId}
          week={week}
          requests={weekRequests}
          actioningKey={actioningKey}
          onResolve={handleResolve}
        />
      ))}
    </section>
  )
}
