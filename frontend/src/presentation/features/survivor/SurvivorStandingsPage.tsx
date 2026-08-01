import { useEffect } from 'react'
import { useDefaultGroup } from '@/presentation/hooks/useDefaultGroup'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
import { useListSurvivorGroupState } from '@/presentation/hooks/useListSurvivorGroupState'
import { Icon } from '@/presentation/components/Icon/Icon'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import type { SurvivorParticipant } from '@/core/entities/survivor'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import { SurvivorLifeIndicator } from './SurvivorLifeIndicator'
import styles from './SurvivorStandingsPage.module.css'

const RANK_LABEL: Record<number, string> = { 1: '1er lugar', 2: '2do lugar', 3: '3er lugar' }

function sortRoster(roster: SurvivorParticipant[]): SurvivorParticipant[] {
  return [...roster].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'alive' ? -1 : 1
    return b.currentLife - a.currentLife
  })
}

/** Tareas 3.4/3.7 (modulo-survivor): estado actual de cada participante y podio final una vez que el pool concluye. */
export function SurvivorStandingsPage() {
  const { data: group, run: loadGroup } = useDefaultGroup()
  const { data: weeks, run: loadWeeks } = useListWeeks()
  const { status, data: roster, error, run: loadRoster } = useListSurvivorGroupState()

  useEffect(() => {
    loadGroup()
    loadWeeks()
  }, [loadGroup, loadWeeks])

  useEffect(() => {
    if (group) loadRoster({ groupId: group.id })
  }, [group, loadRoster])

  function weekNumberLabel(weekId: string | null): string {
    if (!weekId) return ''
    const week = weeks?.find((w) => w.id === weekId)
    return week ? weekLabel(week) : ''
  }

  const podium = (roster ?? [])
    .filter((participant) => participant.finalRank != null)
    .sort((a, b) => (a.finalRank ?? 0) - (b.finalRank ?? 0))

  const sortedRoster = sortRoster(roster ?? [])

  return (
    <section>
      <span className="kicker">
        <Icon name="trophy" size={13} /> Survivor
      </span>
      <h1 className="text-display-lg">Estado del grupo</h1>

      {status === 'pending' && <p>Cargando...</p>}
      {error && <EmptyState message="No pudimos cargar el estado de survivor." />}

      {podium.length > 0 && (
        <div className={styles.podium}>
          {podium.map((participant) => (
            <div key={participant.userId} className={`${styles.podiumRow} glass-surface`}>
              <span className={styles.podiumRank}>{RANK_LABEL[participant.finalRank ?? 0] ?? ''}</span>
              <span className={styles.podiumName}>{participant.displayName}</span>
            </div>
          ))}
        </div>
      )}

      <ul className={styles.list}>
        {sortedRoster.map((participant) => (
          <li key={participant.userId} className={`${styles.row} glass-surface`}>
            <span className={styles.name}>{participant.displayName}</span>
            {participant.status === 'alive' ? (
              <span className={`${styles.statusPill} ${styles.statusAlive}`}>
                Vivo · <SurvivorLifeIndicator currentLife={participant.currentLife} />
              </span>
            ) : (
              <span className={`${styles.statusPill} ${styles.statusEliminated}`}>
                Eliminado · {weekNumberLabel(participant.eliminatedWeekId)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
