import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useCanViewPlayoffTables } from '@/presentation/hooks/useCanViewPlayoffTables'
import { useListPlayoffRoundStandings } from '@/presentation/hooks/useListPlayoffRoundStandings'
import { useListPlayoffFinalStandings } from '@/presentation/hooks/useListPlayoffFinalStandings'
import { resolveTiedRanking } from '@/core/rules/resolveTiedRanking'
import type { PlayoffStandingRow } from '@/core/ports/PlayoffsRepository'
import { WeekSelector } from '@/presentation/components/WeekSelector/WeekSelector'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { Icon } from '@/presentation/components/Icon/Icon'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import styles from './PlayoffsStandingsPage.module.css'

const PODIUM_LABEL: Record<number, string> = { 1: '1er lugar', 2: '2do lugar', 3: '3er lugar' }

function pluralAciertos(count: number): string {
  return count === 1 ? 'acierto' : 'aciertos'
}

/** Posiciones con empate compartido (1,2,2,4): resolveTiedRanking solo reporta el empate, sin desempate. */
function RankedList({ rows }: { rows: PlayoffStandingRow[] }) {
  if (rows.length === 0) return <p className="text-body-sm text-muted">Todavía no hay resultados para mostrar.</p>
  const namesById = new Map(rows.map((row) => [row.userId, row.displayName]))
  const groups = resolveTiedRanking(rows.map((row) => ({ userId: row.userId, total: row.correctCount })))

  return (
    <ol className={`${styles.tiers} glass-surface`}>
      {groups.map((group) => (
        <li key={group.position} className={styles.tier}>
          <div className={styles.tierHead}>
            <span className={styles.tierPosition}>{group.position}°</span>
            <span>
              <strong>{group.total}</strong> {pluralAciertos(group.total)}
              {group.userIds.length > 1 && <span className={styles.tieTag}> · Empate</span>}
            </span>
          </div>
          <ul className={styles.members}>
            {group.userIds.map((userId) => (
              <li key={userId}>{namesById.get(userId) ?? userId}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

/** Podio de 3 lugares; un empate en cualquier posición lista a todos los empatados en ella. */
function FinalPodium({ rows }: { rows: PlayoffStandingRow[] }) {
  if (rows.length === 0) return <p className="text-body-sm text-muted">Todavía no hay resultados para mostrar.</p>
  const namesById = new Map(rows.map((row) => [row.userId, row.displayName]))
  const groups = resolveTiedRanking(rows.map((row) => ({ userId: row.userId, total: row.correctCount })))
  // Se muestran las posiciones 1.º, 2.º y 3.º; tras un empate el siguiente grupo cae en su posición estándar (p. ej. 1,1,3).
  const podium = groups.filter((group) => group.position <= 3)
  const rest = rows.filter((row) => !podium.some((group) => group.userIds.includes(row.userId)))

  return (
    <>
      <ol className={styles.podium}>
        {podium.map((group) => (
          <li key={group.position} className={`${styles.podiumSlot} glass-surface`} data-position={group.position}>
            <span className={styles.podiumLabel}>
              {group.position === 1 && <Icon name="trophy" size={14} />}
              {PODIUM_LABEL[group.position]}
              {group.userIds.length > 1 && ' (empate)'}
            </span>
            <span className={styles.podiumScore}>{group.total}</span>
            <span className="text-body-sm text-muted">{pluralAciertos(group.total)}</span>
            <ul className={styles.members}>
              {group.userIds.map((userId) => (
                <li key={userId}>{namesById.get(userId) ?? userId}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      {rest.length > 0 && <RankedList rows={rest} />}
    </>
  )
}

/** Tareas 3.4/3.5 (modulo-playoffs): tabla de resultados por ronda y ranking final con podio. */
export function PlayoffsStandingsPage() {
  const { weekId } = useParams<{ weekId: string }>()
  const { data: group } = useSession().group
  const { data: weeks } = useSession().weeks
  const { data: canView, run: loadCanView } = useCanViewPlayoffTables()
  const { status: roundStatus, data: roundRows, run: loadRound } = useListPlayoffRoundStandings()
  const { status: finalStatus, data: finalRows, run: loadFinal } = useListPlayoffFinalStandings()

  useEffect(() => {
    if (group) {
      loadCanView({ groupId: group.id }).catch(() => {})
      loadFinal({ groupId: group.id }).catch(() => {})
    }
  }, [group, loadCanView, loadFinal])

  useEffect(() => {
    if (group && weekId) loadRound({ groupId: group.id, weekId }).catch(() => {})
  }, [group, weekId, loadRound])

  if (!weekId) return null
  const activeWeek = weeks?.find((week) => week.id === weekId)

  return (
    <section>
      <h1 className="text-display-lg">Tabla de playoffs</h1>
      <WeekSelector activeWeekId={weekId} linkTo={(id) => `/playoffs/tabla/${id}`} allowedSegments={['playoffs']} />

      {canView === false && <EmptyState message={EMPTY_STATE_COPY.noModuleAccess} />}

      {canView && (
        <>
          <div className={styles.section}>
            <h2 className={`text-display-sm ${styles.sectionTitle}`}>
              {activeWeek ? weekLabel(activeWeek) : 'Esta ronda'}
            </h2>
            {roundStatus === 'pending' && <LoadingSpinner variant="inline" />}
            <RankedList rows={roundRows ?? []} />
          </div>

          <div className={styles.section}>
            <h2 className={`text-display-sm ${styles.sectionTitle}`}>Ranking final de playoffs</h2>
            {finalStatus === 'pending' && <LoadingSpinner variant="inline" />}
            <FinalPodium rows={finalRows ?? []} />
          </div>
        </>
      )}
    </section>
  )
}
