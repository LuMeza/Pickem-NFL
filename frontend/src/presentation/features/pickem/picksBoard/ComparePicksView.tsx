import { useMemo, useState } from 'react'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { getInitials } from '@/core/rules/getInitials'
import { comparePicks, countCorrectPicks, type PickComparisonRow } from '@/core/rules/comparePicks'
import type { WeeklyPickValue } from '@/core/ports/WeeklyPickRepository'
import type { Game } from '@/core/entities/catalog'
import type { BoardUser } from './boardTypes'
import { PlayerPicker } from './PlayerPicker'
import styles from './PicksBoard.module.css'

type Filter = 'all' | 'differ' | 'agree'

interface ComparePicksViewProps {
  me: BoardUser
  others: BoardUser[]
  games: Game[]
  teamName: (id: string) => string
  comparedUserId: string | null
  onChangeUser: (userId: string) => void
}

function firstName(displayName: string): string {
  return displayName.split(' ')[0] ?? displayName
}

function PickPill({
  who,
  pick,
  game,
  teamName,
  correct,
}: {
  who: string
  pick: WeeklyPickValue | null
  game: Game
  teamName: (id: string) => string
  correct: boolean | null
}) {
  const tone = correct === true ? styles.pillOk : correct === false ? styles.pillBad : ''
  const teamId = pick === 'home' ? game.homeTeamId : pick === 'away' ? game.awayTeamId : null
  const label = pick === null ? 'Sin pick' : pick === 'tie' ? 'Empate' : teamName(teamId!)

  return (
    <div className={`${styles.pill} ${tone}`}>
      {teamId ? <TeamBadge teamId={teamId} size="xs" /> : <span className={styles.pillBlank} aria-hidden="true" />}
      <span className={styles.pillText}>
        <span className={styles.pillWho}>{who}</span>
        <span className={styles.pillTeam}>{label}</span>
      </span>
      {correct === true && <span className={styles.markOk} aria-label="Acertó">✓</span>}
      {correct === false && <span className={styles.markBad} aria-label="Falló">✕</span>}
    </div>
  )
}

function resultText(row: PickComparisonRow, game: Game, teamName: (id: string) => string): string {
  if (row.outcome === null) return 'Por jugarse'
  if (row.outcome === 'tie') return 'Empate'
  return `Ganó ${teamName(row.outcome === 'home' ? game.homeTeamId : game.awayTeamId)}`
}

/** Compara tus picks contra los de otra persona, partido por partido, con filtro para ver solo donde difieren. */
export function ComparePicksView({ me, others, games, teamName, comparedUserId, onChangeUser }: ComparePicksViewProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [filterChoice, setFilterChoice] = useState<Filter | null>(null)

  const gameIds = useMemo(() => games.map((game) => game.id), [games])
  const them = others.find((user) => user.userId === comparedUserId) ?? null

  // La semana siempre tiene a alguien más; si no eligieron a nadie todavía, se arranca con quien va arriba.
  const fallback = useMemo(
    () => [...others].sort((a, b) => countCorrectPicks(b.cells) - countCorrectPicks(a.cells))[0] ?? null,
    [others],
  )
  const target = them ?? fallback
  const comparison = useMemo(
    () => (target ? comparePicks(gameIds, me.cells, target.cells) : null),
    [gameIds, me, target],
  )

  if (!target || !comparison) {
    return <p className="text-body-sm text-muted">Todavía no hay otros jugadores con picks para comparar.</p>
  }

  const filter: Filter = filterChoice ?? (comparison.differCount > 0 ? 'differ' : 'all')
  const gameById = new Map(games.map((game) => [game.id, game]))
  const rows = comparison.rows.filter((row) => (filter === 'all' ? true : filter === 'agree' ? row.agree : !row.agree))

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: comparison.rows.length },
    { key: 'differ', label: 'Difieren', count: comparison.differCount },
    { key: 'agree', label: 'Coinciden', count: comparison.agreeCount },
  ]

  return (
    <div className={styles.compareView}>
      <div className={styles.versus}>
        <div className={`${styles.whoCard} glass-surface`}>
          <span className={styles.chipAvatar}>{getInitials(me.displayName)}</span>
          <span className={styles.whoName}>Tú</span>
        </div>
        <span className={styles.versusLabel}>vs</span>
        <button
          type="button"
          className={`${styles.whoCard} ${styles.whoButton} glass-surface glass-interactive`}
          onClick={() => setPickerOpen(true)}
          aria-label={`Comparando con ${target.displayName}. Cambiar jugador`}
        >
          <span className={styles.chipAvatar}>{getInitials(target.displayName)}</span>
          <span className={styles.whoName}>{target.displayName}</span>
          <span aria-hidden="true">▾</span>
        </button>
      </div>

      <dl className={`${styles.stats} glass-surface`}>
        <div className={styles.stat}>
          <dt>Tus aciertos</dt>
          <dd>{comparison.mineCorrect}</dd>
          <span>de {comparison.rows.length}</span>
        </div>
        <div className={styles.stat}>
          <dt>Coinciden</dt>
          <dd className={styles.statAccent}>{comparison.agreeCount}</dd>
          <span>de {comparison.rows.length} picks</span>
        </div>
        <div className={styles.stat}>
          <dt>Aciertos de {firstName(target.displayName)}</dt>
          <dd>{comparison.theirsCorrect}</dd>
          <span>de {comparison.rows.length}</span>
        </div>
      </dl>

      <div className={styles.filters} role="group" aria-label="Filtrar partidos">
        {filters.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={filter === option.key}
            className={`${styles.filterChip} ${filter === option.key ? styles.filterChipOn : ''}`}
            onClick={() => setFilterChoice(option.key)}
          >
            {option.label} {option.count}
          </button>
        ))}
      </div>

      {rows.length === 0 && (
        <p className="text-body-sm text-muted">
          {filter === 'differ' ? 'Coinciden en todos los partidos.' : 'No coinciden en ningún partido.'}
        </p>
      )}

      <ul className={styles.cmpList}>
        {rows.map((row) => {
          const game = gameById.get(row.gameId)
          if (!game) return null
          return (
            <li key={row.gameId} className={`${styles.cmpRow} glass-surface`}>
              <div className={styles.cmpHead}>
                <span className={styles.cmpTitle}>
                  {teamName(game.awayTeamId)} en {teamName(game.homeTeamId)}
                </span>
                <span className={styles.cmpResult}>{resultText(row, game, teamName)}</span>
              </div>
              <div className={styles.pills}>
                <PickPill who="Tú" pick={row.mine} game={game} teamName={teamName} correct={row.mineCorrect} />
                <PickPill
                  who={firstName(target.displayName)}
                  pick={row.theirs}
                  game={game}
                  teamName={teamName}
                  correct={row.theirsCorrect}
                />
              </div>
            </li>
          )
        })}
      </ul>

      <PlayerPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        me={me}
        others={others}
        gameIds={gameIds}
        selectedUserId={target.userId}
        onSelect={(userId) => {
          onChangeUser(userId)
          setFilterChoice(null)
        }}
      />
    </div>
  )
}
