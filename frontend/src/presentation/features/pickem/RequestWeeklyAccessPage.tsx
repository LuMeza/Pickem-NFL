import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDefaultGroup } from '@/presentation/hooks/useDefaultGroup'
import { useGetProfile } from '@/presentation/hooks/useGetProfile'
import { useGetWeeklyAccessStatus } from '@/presentation/hooks/useGetWeeklyAccessStatus'
import { useRequestWeeklyAccess } from '@/presentation/hooks/useRequestWeeklyAccess'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
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
  const { data: group, run: loadGroup } = useDefaultGroup()
  const { data: profile, run: loadProfile } = useGetProfile()
  const { data: weeks, run: loadWeeks } = useListWeeks()
  const { data: games, run: loadGames } = useListGamesForWeek()
  const { data: accessStatus, run: loadStatus } = useGetWeeklyAccessStatus()
  const { status: requestStatus, run: requestAccess } = useRequestWeeklyAccess()

  useEffect(() => {
    loadGroup()
    loadProfile()
    loadWeeks()
  }, [loadGroup, loadProfile, loadWeeks])

  useEffect(() => {
    if (weekId) loadGames({ weekId })
  }, [weekId, loadGames])

  useEffect(() => {
    if (group && profile && weekId) loadStatus({ groupId: group.id, userId: profile.userId, weekId })
  }, [group, profile, weekId, loadStatus])

  async function handleRequest() {
    if (!group || !profile || !weekId) return
    await requestAccess({ groupId: group.id, userId: profile.userId, weekId })
    await loadStatus({ groupId: group.id, userId: profile.userId, weekId })
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
            {accessStatus ? (
              <span className={`${styles.badge} ${BADGE_CLASS[accessStatus]}`}>{BADGE_LABEL[accessStatus]}</span>
            ) : locked ? (
              <span className="text-body-sm text-muted">Ya inicio el primer partido de esta semana.</span>
            ) : (
              <button type="button" onClick={handleRequest} disabled={requestStatus === 'pending'}>
                Solicitar acceso
              </button>
            )}
          </div>
        )
      )}
    </section>
  )
}
