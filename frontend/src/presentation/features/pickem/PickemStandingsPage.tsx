import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDefaultGroup } from '@/presentation/hooks/useDefaultGroup'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useCanViewPickemTables } from '@/presentation/hooks/useCanViewPickemTables'
import { useListWeeklyStandings } from '@/presentation/hooks/useListWeeklyStandings'
import { useListSeasonStandings } from '@/presentation/hooks/useListSeasonStandings'
import { WeekSelector } from '@/presentation/components/WeekSelector/WeekSelector'
import { Icon } from '@/presentation/components/Icon/Icon'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { isPlayoffsStarted } from '@/core/rules/isPlayoffsStarted'
import { resolveTiedRanking } from '@/core/rules/resolveTiedRanking'
import type { StandingRow } from '@/core/entities/standings'
import { weekLabel } from './weekLabel'
import styles from './PickemStandingsPage.module.css'

function StandingsList({ rows }: { rows: StandingRow[] }) {
  if (rows.length === 0) {
    return <p className="text-body-sm text-muted">Todavia no hay resultados para mostrar.</p>
  }

  let position = 0
  let previousCount: number | null = null
  return (
    <ul className={styles.list}>
      {rows.map((row, index) => {
        if (row.correctCount !== previousCount) {
          position = index + 1
          previousCount = row.correctCount
        }
        return (
          <li key={row.userId} className={`${styles.row} glass-surface`}>
            <span className={styles.position}>{position}</span>
            <span className={styles.name}>{row.displayName}</span>
            <span className={styles.count}>{row.correctCount}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** Tareas 4.3/4.4/4.6/4.7 (modulo-pickem-semanal): tabla semanal, tabla acumulada de temporada, ganador(es) y resultado final al iniciar playoffs. */
export function PickemStandingsPage() {
  const { weekId } = useParams<{ weekId: string }>()
  const { data: group, run: loadGroup } = useDefaultGroup()
  const { data: weeks, run: loadWeeks } = useListWeeks()
  const { data: canView, run: loadCanView } = useCanViewPickemTables()
  const { status: weeklyStatus, data: weeklyStandings, run: loadWeeklyStandings } = useListWeeklyStandings()
  const { data: seasonStandings, run: loadSeasonStandings } = useListSeasonStandings()
  const { data: wildCardGames, run: loadWildCardGames } = useListGamesForWeek()

  useEffect(() => {
    loadGroup()
    loadWeeks()
  }, [loadGroup, loadWeeks])

  useEffect(() => {
    if (group && weekId) {
      loadCanView({ groupId: group.id })
      loadWeeklyStandings({ groupId: group.id, weekId })
      loadSeasonStandings({ groupId: group.id })
    }
  }, [group, weekId, loadCanView, loadWeeklyStandings, loadSeasonStandings])

  const wildCardWeek = weeks?.find((week) => week.type === 'playoffs' && week.number === 1)
  useEffect(() => {
    if (wildCardWeek) loadWildCardGames({ weekId: wildCardWeek.id })
  }, [wildCardWeek, loadWildCardGames])

  if (!weekId) return null

  const activeWeek = weeks?.find((week) => week.id === weekId)
  const playoffsStarted = wildCardWeek ? isPlayoffsStarted([wildCardWeek], wildCardGames ?? [], new Date()) : false
  const winners = playoffsStarted
    ? resolveTiedRanking((seasonStandings ?? []).map((row) => ({ userId: row.userId, total: row.correctCount })))[0]
    : undefined
  const winnerNames = winners
    ? winners.userIds
        .map((userId) => seasonStandings?.find((row) => row.userId === userId)?.displayName ?? userId)
        .join(', ')
    : ''

  return (
    <section>
      <span className="kicker">
        <Icon name="trophy" size={13} /> Pickem semanal
      </span>
      <h1 className="text-display-lg">Tabla de posiciones</h1>
      <WeekSelector activeWeekId={weekId} linkTo={(id) => `/pickem/tabla/${id}`} />

      {canView === false && <EmptyState message={EMPTY_STATE_COPY.noModuleAccess} />}

      {canView && (
        <>
          {playoffsStarted && winners && (
            <div className={`${styles.winnerBanner} glass-surface`}>
              <span className="text-body-sm text-muted">Resultado final de temporada</span>
              <p className="text-display-sm">
                {winners.userIds.length > 1 ? 'Empate en el primer lugar: ' : 'Ganador: '}
                {winnerNames} ({winners.total} aciertos)
              </p>
            </div>
          )}

          <div className={styles.section}>
            <h2 className={`text-display-sm ${styles.sectionTitle}`}>
              {activeWeek ? weekLabel(activeWeek) : 'Esta semana'}
            </h2>
            {weeklyStatus === 'pending' && <p>Cargando...</p>}
            <StandingsList rows={weeklyStandings ?? []} />
          </div>

          <div className={styles.section}>
            <h2 className={`text-display-sm ${styles.sectionTitle}`}>
              {playoffsStarted ? 'Tabla final de temporada' : 'Tabla acumulada de temporada'}
            </h2>
            <StandingsList rows={seasonStandings ?? []} />
          </div>
        </>
      )}
    </section>
  )
}
