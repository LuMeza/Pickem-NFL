import { useEffect, type ReactNode } from 'react'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListSurvivorGroupState } from '@/presentation/hooks/useListSurvivorGroupState'
import { Icon } from '@/presentation/components/Icon/Icon'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import type { SurvivorParticipant } from '@/core/entities/survivor'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import { SurvivorLifeIndicator } from './SurvivorLifeIndicator'
import styles from './SurvivorStandingsPage.module.css'

const RANK_LABEL: Record<number, string> = { 1: '1er lugar', 2: '2do lugar', 3: '3er lugar' }

const STATUS_RANK: Record<SurvivorParticipant['status'], number> = {
  alive: 0,
  eliminated: 1,
}

function sortRoster(roster: SurvivorParticipant[]): SurvivorParticipant[] {
  return [...roster].sort((a, b) => {
    if (STATUS_RANK[a.status] !== STATUS_RANK[b.status]) return STATUS_RANK[a.status] - STATUS_RANK[b.status]
    return b.currentLife - a.currentLife
  })
}

/** Tareas 3.4/3.7 (modulo-survivor): estado actual de cada participante y podio final una vez que el pool concluye. */
export function SurvivorStandingsPage() {
  const { data: group } = useSession().group
  const { data: weeks } = useSession().weeks
  const { status, data: roster, error, run: loadRoster } = useListSurvivorGroupState()

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
  const alive = sortedRoster.filter((participant) => participant.status === 'alive')
  const reviving = sortedRoster.filter(
    (participant) => participant.status === 'eliminated' && participant.revivalDeadlineWeekId != null,
  )
  const out = sortedRoster.filter(
    (participant) => participant.status === 'eliminated' && participant.revivalDeadlineWeekId == null,
  )

  function RosterGroup({
    title,
    caption,
    tone,
    participants,
    renderStatus,
  }: {
    title: string
    caption: string
    tone: 'alive' | 'revive' | 'out'
    participants: SurvivorParticipant[]
    renderStatus: (participant: SurvivorParticipant) => ReactNode
  }) {
    if (participants.length === 0) return null
    const pillClass = { alive: styles.statusAlive, revive: styles.statusRevive, out: styles.statusEliminated }[tone]
    return (
      <div className={styles.group}>
        <h2 className={styles.groupTitle}>
          {title} <span className={styles.groupCount}>{participants.length}</span>
        </h2>
        <p className={styles.groupCaption}>{caption}</p>
        <ul className={styles.list}>
          {participants.map((participant) => (
            <li key={participant.userId} className={`${styles.row} glass-surface`}>
              <span className={styles.name}>{participant.displayName}</span>
              <span className={`${styles.statusPill} ${pillClass}`}>{renderStatus(participant)}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <section>
      <span className="kicker">
        <Icon name="trophy" size={13} /> Survivor
      </span>
      <h1 className="text-display-lg">Estado del grupo</h1>

      {status === 'pending' && <LoadingSpinner variant="inline" />}
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

      {roster && roster.length > 0 && (
        <p className="text-body-sm text-muted">
          {alive.length} en juego · {reviving.length} pueden revivir · {out.length} eliminados
        </p>
      )}

      <RosterGroup
        title="Vivos"
        caption="Su equipo ganó cada semana (o ya revivieron)."
        tone="alive"
        participants={alive}
        renderStatus={(participant) => (
          <>
            Vivo · <SurvivorLifeIndicator currentLife={participant.currentLife} />
          </>
        )}
      />
      <RosterGroup
        title="Pueden revivir"
        caption="Perdieron, pero les queda una vida extra: si eligen equipo a tiempo en su semana, vuelven."
        tone="revive"
        participants={reviving}
        renderStatus={(participant) => <>Elige en {weekNumberLabel(participant.revivalDeadlineWeekId)}</>}
      />
      <RosterGroup
        title="Eliminados"
        caption="Ya no pueden volver esta temporada."
        tone="out"
        participants={out}
        renderStatus={(participant) => <>Fuera · {weekNumberLabel(participant.eliminatedWeekId)}</>}
      />
    </section>
  )
}
