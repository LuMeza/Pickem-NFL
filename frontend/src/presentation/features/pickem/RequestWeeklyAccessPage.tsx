import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useGetWeeklyAccessStatus } from '@/presentation/hooks/useGetWeeklyAccessStatus'
import { useRequestWeeklyAccess } from '@/presentation/hooks/useRequestWeeklyAccess'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { WeekSelector } from '@/presentation/components/WeekSelector/WeekSelector'
import { Icon } from '@/presentation/components/Icon/Icon'
import type { WeeklyAccessStatus } from '@/core/ports/WeeklyAccessRepository'
import { isWeekAccessLocked } from '@/core/rules/isWeekAccessLocked'
import { weekLabel } from './weekLabel'
import styles from './RequestWeeklyAccessPage.module.css'

const BADGE_CLASS: Record<WeeklyAccessStatus, string> = {
  solicitado: styles.badgeSolicitado ?? '',
  aprobado: styles.badgeAprobado ?? '',
  rechazado: styles.badgeRechazado ?? '',
}

const BADGE_LABEL: Record<WeeklyAccessStatus, string> = {
  solicitado: 'Pendiente de aprobación',
  aprobado: 'Activo esta semana',
  rechazado: 'Rechazado',
}

/** Tarea 2.1 (modulo-pickem-semanal): un miembro solicita/ve su acceso al pickem de una semana puntual. */
export function RequestWeeklyAccessPage() {
  const { weekId } = useParams<{ weekId: string }>()
  const { data: group } = useSession().group
  const { data: profile } = useSession().profile
  const { data: weeks } = useSession().weeks
  const { data: games, run: loadGames } = useListGamesForWeek()
  const { data: accessStatus, run: loadStatus } = useGetWeeklyAccessStatus()
  const { status: requestStatus, error: requestError, run: requestAccess } = useRequestWeeklyAccess()

  useEffect(() => {
    if (weekId) loadGames({ weekId })
  }, [weekId, loadGames])

  useEffect(() => {
    if (group && profile && weekId) loadStatus({ groupId: group.id, userId: profile.userId, weekId })
  }, [group, profile, weekId, loadStatus])

  async function handleRequest() {
    if (!group || !profile || !weekId) return
    try {
      await requestAccess({ groupId: group.id, userId: profile.userId, weekId })
      await loadStatus({ groupId: group.id, userId: profile.userId, weekId })
    } catch {
      // el error queda reflejado via requestError, ver render mas abajo
    }
  }

  if (!weekId) return null

  const activeWeek = weeks?.find((week) => week.id === weekId)
  const isPlayoffsWeek = activeWeek?.type === 'playoffs'
  const locked = isWeekAccessLocked(games ?? [], new Date())

  return (
    <section>
      <span className="kicker">
        <Icon name="ticket" size={13} /> Pickem semanal
      </span>
      <h1 className="text-display-md">Acceso al pickem</h1>
      <p className="text-body-sm text-muted">
        El acceso al Pickem Semanal se aprueba semana a semana: solicita entrar a la semana que quieres jugar,
        antes de que arranque el primer partido. Ganar acceso en una semana no te da acceso a las demás.
      </p>
      <WeekSelector activeWeekId={weekId} linkTo={(id) => `/pickem/acceso/${id}`} />

      {isPlayoffsWeek ? (
        <p className="text-body-sm text-muted">El pickem semanal no aplica a semanas de playoffs.</p>
      ) : (
        group &&
        profile && (
          <div className={`${styles.row} glass-surface`}>
            <span className={styles.label}>{activeWeek ? weekLabel(activeWeek) : 'Esta semana'}</span>
            {accessStatus === 'rechazado' && !locked ? (
              <span className={styles.actions}>
                <span className={`${styles.badge} ${BADGE_CLASS[accessStatus]}`}>{BADGE_LABEL[accessStatus]}</span>
                <button type="button" onClick={handleRequest} disabled={requestStatus === 'pending'}>
                  {requestStatus === 'pending' ? 'Enviando...' : 'Volver a solicitar'}
                </button>
              </span>
            ) : accessStatus === 'aprobado' ? (
              <span className={styles.actions}>
                <span className={`${styles.badge} ${BADGE_CLASS[accessStatus]}`}>{BADGE_LABEL[accessStatus]}</span>
                <Link to={`/weeks/${weekId}/games`} className={styles.pickCta}>
                  Ver partidos y picks
                </Link>
              </span>
            ) : accessStatus ? (
              <span className={`${styles.badge} ${BADGE_CLASS[accessStatus]}`}>{BADGE_LABEL[accessStatus]}</span>
            ) : locked ? (
              <span className="text-body-sm text-muted">Ya inicio el primer partido de esta semana.</span>
            ) : (
              <button type="button" onClick={handleRequest} disabled={requestStatus === 'pending'}>
                {requestStatus === 'pending' ? 'Enviando...' : 'Solicitar acceso'}
              </button>
            )}
          </div>
        )
      )}
      {requestError && (
        <p className="text-body-sm" role="alert">
          No se pudo enviar tu solicitud. Intenta de nuevo.
        </p>
      )}
    </section>
  )
}
