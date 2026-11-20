import { useMemo, useState } from 'react'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { getTeamColors } from '@/presentation/components/TeamBadge/teamColors'
import { groupPicksForGame, type GamePickEntry } from '@/core/rules/groupPicksForGame'
import type { Game } from '@/core/entities/catalog'
import type { BoardUser } from './boardTypes'
import styles from './PicksBoard.module.css'

/** Cuántos nombres se muestran por grupo antes de pedir "+N más". */
const VISIBLE_CHIPS = 8

interface GamePicksViewProps {
  users: BoardUser[]
  games: Game[]
  teamName: (id: string) => string
  currentUserId: string | null | undefined
  /** Tocar un nombre abre la comparación contra esa persona. */
  onCompare: (userId: string) => void
}

function kickoffLabel(game: Game): string {
  const day = game.kickoffAt.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })
  const time = game.kickoffAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return `${day}, ${time}`
}

interface PickGroupProps {
  title: string
  entries: GamePickEntry[]
  verdict: 'ok' | 'bad' | null
  expanded: boolean
  onToggle: () => void
  currentUserId: string | null | undefined
  onCompare: (userId: string) => void
}

function PickGroup({ title, entries, verdict, expanded, onToggle, currentUserId, onCompare }: PickGroupProps) {
  if (entries.length === 0) return null

  // Tu nombre primero: es lo primero que uno busca.
  const sorted = [...entries].sort((a, b) => Number(b.userId === currentUserId) - Number(a.userId === currentUserId))
  const visible = expanded ? sorted : sorted.slice(0, VISIBLE_CHIPS)
  const hidden = sorted.length - visible.length

  return (
    <section className={styles.group}>
      <div className={styles.groupHead}>
        <h3 className={styles.groupTitle}>
          {title} <span className={styles.groupCount}>{entries.length}</span>
        </h3>
        {verdict === 'ok' && <span className={styles.verdictOk}>✓ Acertaron</span>}
        {verdict === 'bad' && <span className={styles.verdictBad}>✕ Fallaron</span>}
      </div>
      <ul className={styles.chips}>
        {visible.map((entry) => {
          const isMe = entry.userId === currentUserId
          const content = (
            <>
              {entry.displayName}
              {isMe ? ', tú' : ''}
            </>
          )
          return (
            <li key={entry.userId}>
              {isMe ? (
                <span className={`${styles.chip} ${styles.chipMe}`}>{content}</span>
              ) : (
                <button
                  type="button"
                  className={`${styles.chip} ${styles.chipButton}`}
                  onClick={() => onCompare(entry.userId)}
                  aria-label={`Compararte con ${entry.displayName}`}
                >
                  {content}
                </button>
              )}
            </li>
          )
        })}
        {hidden > 0 && (
          <li>
            <button type="button" className={`${styles.chip} ${styles.chipMore}`} onClick={onToggle}>
              +{hidden} más
            </button>
          </li>
        )}
      </ul>
      {expanded && entries.length > VISIBLE_CHIPS && (
        <button type="button" className={styles.linkButton} onClick={onToggle}>
          Ver menos
        </button>
      )}
    </section>
  )
}

/** Vista principal de "Picks de todos": un partido a la vez, con cuántos eligieron cada lado y quiénes. */
export function GamePicksView({ users, games, teamName, currentUserId, onCompare }: GamePicksViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const game = games.find((candidate) => candidate.id === selectedId) ?? games[0]

  const groups = useMemo(() => {
    if (!game) return null
    return groupPicksForGame(
      users.map((user) => ({
        userId: user.userId,
        displayName: user.displayName,
        pick: user.cells.get(game.id)?.pick ?? null,
        outcome: user.cells.get(game.id)?.outcome ?? null,
      })),
    )
  }, [users, game])

  if (!game || !groups) return null

  const awayName = teamName(game.awayTeamId)
  const homeName = teamName(game.homeTeamId)
  const totalPicks = groups.home.length + groups.away.length + groups.tie.length
  const share = (count: number) => (totalPicks > 0 ? (count / totalPicks) * 100 : 0)

  const winnerLabel =
    groups.outcome === null
      ? 'Por jugarse'
      : groups.outcome === 'tie'
        ? 'Terminó en empate'
        : `Ganó ${groups.outcome === 'home' ? homeName : awayName}`

  function toggle(key: string) {
    setExpandedGroups((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const verdictFor = (side: 'home' | 'away' | 'tie'): 'ok' | 'bad' | null =>
    groups.outcome === null ? null : groups.outcome === side ? 'ok' : 'bad'

  return (
    <div className={styles.gameView}>
      <div className={styles.gameStrip} role="tablist" aria-label="Partidos de la semana">
        {games.map((candidate) => {
          const active = candidate.id === game.id
          return (
            <button
              key={candidate.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`${teamName(candidate.awayTeamId)} en ${teamName(candidate.homeTeamId)}`}
              className={`${styles.gameChip} ${active ? styles.gameChipActive : ''}`}
              onClick={() => setSelectedId(candidate.id)}
            >
              <TeamBadge teamId={candidate.awayTeamId} size="xs" />
              <TeamBadge teamId={candidate.homeTeamId} size="xs" />
            </button>
          )
        })}
      </div>

      <div className={`${styles.gameCard} glass-surface`}>
        <div className={styles.gameCardHead}>
          <div className={styles.gameCardTitleBlock}>
            <h2 className={styles.gameTitle}>
              {awayName} en {homeName}
            </h2>
            <span className={styles.gameMeta}>{kickoffLabel(game)}</span>
          </div>
          <span className={styles.resultTag}>{winnerLabel}</span>
        </div>

        {totalPicks > 0 && (
          <div className={styles.split}>
            <div className={styles.splitLegend}>
              <span>
                {awayName} <strong>{groups.away.length}</strong>
              </span>
              {groups.tie.length > 0 && (
                <span>
                  Empate <strong>{groups.tie.length}</strong>
                </span>
              )}
              <span>
                {homeName} <strong>{groups.home.length}</strong>
              </span>
            </div>
            <div className={styles.splitBar} aria-hidden="true">
              <span style={{ width: `${share(groups.away.length)}%`, background: getTeamColors(game.awayTeamId).primary }} />
              {groups.tie.length > 0 && (
                <span style={{ width: `${share(groups.tie.length)}%`, background: 'var(--text-muted)' }} />
              )}
              <span style={{ width: `${share(groups.home.length)}%`, background: getTeamColors(game.homeTeamId).primary }} />
            </div>
          </div>
        )}
      </div>

      <PickGroup
        title={`Eligieron ${awayName}`}
        entries={groups.away}
        verdict={verdictFor('away')}
        expanded={expandedGroups.has('away')}
        onToggle={() => toggle('away')}
        currentUserId={currentUserId}
        onCompare={onCompare}
      />
      <PickGroup
        title={`Eligieron ${homeName}`}
        entries={groups.home}
        verdict={verdictFor('home')}
        expanded={expandedGroups.has('home')}
        onToggle={() => toggle('home')}
        currentUserId={currentUserId}
        onCompare={onCompare}
      />
      <PickGroup
        title="Eligieron empate"
        entries={groups.tie}
        verdict={verdictFor('tie')}
        expanded={expandedGroups.has('tie')}
        onToggle={() => toggle('tie')}
        currentUserId={currentUserId}
        onCompare={onCompare}
      />
    </div>
  )
}
