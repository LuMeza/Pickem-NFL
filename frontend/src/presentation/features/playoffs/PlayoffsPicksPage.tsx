import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useListResultsForGames } from '@/presentation/hooks/useListResultsForGames'
import { useListPlayoffPicksForWeek } from '@/presentation/hooks/useListPlayoffPicksForWeek'
import { useSavePlayoffPick } from '@/presentation/hooks/useSavePlayoffPick'
import { useNow } from '@/presentation/hooks/useNow'
import { classifyPointDifference } from '@/core/rules/classifyPointDifference'
import type { Game } from '@/core/entities/catalog'
import type { GameResult } from '@/core/entities/gameResult'
import type { PlayoffPickValue } from '@/core/ports/PlayoffsRepository'
import { WeekSelector } from '@/presentation/components/WeekSelector/WeekSelector'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './PlayoffsPicksPage.module.css'

const KICKOFF_FORMAT: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }

interface PickOption {
  value: PlayoffPickValue
  label: (game: Game) => string
}

const OPTIONS: PickOption[] = [
  { value: 'local_amplio', label: (game) => `${game.homeTeamId} gana por más de 6` },
  { value: 'cerrado', label: () => 'Cerrado (6 pts o menos)' },
  { value: 'visita_amplio', label: (game) => `${game.awayTeamId} gana por más de 6` },
]

function officialCategory(result: GameResult | null): PlayoffPickValue | null {
  if (!result || result.homeScore === null || result.awayScore === null) return null
  return classifyPointDifference(result.homeScore, result.awayScore)
}

function PlayoffGameCard({
  game,
  pick,
  result,
  locked,
  saveFailed,
  onPick,
}: {
  game: Game
  pick: PlayoffPickValue | null
  result: GameResult | null
  locked: boolean
  saveFailed: boolean
  onPick: (gameId: string, pick: PlayoffPickValue) => void
}) {
  const official = officialCategory(result)
  const correct = official !== null && pick !== null ? pick === official : null

  return (
    <article className={`${styles.card} glass-surface`} data-locked={locked}>
      <header className={styles.cardHeader}>
        <div className={styles.matchup}>
          <TeamBadge teamId={game.awayTeamId} size="sm" />
          <span className={styles.teamAbbr}>{game.awayTeamId}</span>
          <span className={styles.at}>@</span>
          <TeamBadge teamId={game.homeTeamId} size="sm" />
          <span className={styles.teamAbbr}>{game.homeTeamId}</span>
        </div>
        <span className={styles.kickoff}>
          {locked && <Icon name="lock" size={12} />}
          {game.kickoffAt.toLocaleString('es-MX', KICKOFF_FORMAT)}
        </span>
      </header>

      {result && result.homeScore !== null && result.awayScore !== null && (
        <p className={styles.score}>
          Final: {game.awayTeamId} {result.awayScore} – {game.homeTeamId} {result.homeScore}
          {correct !== null && (
            <span className={styles.mark} data-correct={correct} role="img" aria-label={correct ? 'Acertaste' : 'Fallaste'}>
              {correct ? '✓' : '✕'}
            </span>
          )}
        </p>
      )}

      <div className={styles.options} role="group" aria-label={`Pick ${game.awayTeamId} @ ${game.homeTeamId}`}>
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={styles.option}
            data-selected={pick === option.value}
            data-official={official === option.value}
            aria-pressed={pick === option.value}
            disabled={locked}
            onClick={() => onPick(game.id, option.value)}
          >
            {option.label(game)}
          </button>
        ))}
      </div>

      {saveFailed && (
        <p className="text-body-sm" role="alert">
          No se pudo guardar tu pick. Intenta de nuevo.
        </p>
      )}
    </article>
  )
}

/** Tareas 2.1-2.3 (modulo-playoffs): picks por ronda, con bloqueo en UI al iniciar cada partido. */
export function PlayoffsPicksPage() {
  const { weekId } = useParams<{ weekId: string }>()
  const { group: groupResource, profile: profileResource } = useSession()
  const { data: group } = groupResource
  const { data: profile } = profileResource
  const { status, data: games, error, run: loadGames } = useListGamesForWeek()
  const { data: results, run: loadResults } = useListResultsForGames()
  const { data: loadedPicks, run: loadPicks } = useListPlayoffPicksForWeek()
  const { run: savePick } = useSavePlayoffPick()
  const [picks, setPicks] = useState<Record<string, PlayoffPickValue>>({})
  const [failedGameId, setFailedGameId] = useState<string | null>(null)
  const nowMs = useNow()

  useEffect(() => {
    if (weekId) loadGames({ weekId })
  }, [weekId, loadGames])

  useEffect(() => {
    if (profile && weekId) loadPicks({ userId: profile.userId, weekId })
  }, [profile, weekId, loadPicks])

  useEffect(() => {
    if (games && games.length > 0) loadResults({ gameIds: games.map((game) => game.id) }).catch(() => {})
  }, [games, loadResults])

  useEffect(() => {
    if (loadedPicks) setPicks(loadedPicks)
  }, [loadedPicks])

  const resultsByGame = useMemo(() => new Map((results ?? []).map((result) => [result.gameId, result])), [results])

  async function handlePick(gameId: string, pick: PlayoffPickValue) {
    if (!group || !profile) return
    const previous = picks[gameId] ?? null
    setPicks((current) => ({ ...current, [gameId]: pick }))
    setFailedGameId(null)
    try {
      await savePick({ groupId: group.id, userId: profile.userId, gameId, pick })
    } catch {
      setPicks((current) => {
        if (previous) return { ...current, [gameId]: previous }
        const { [gameId]: _unsaved, ...rest } = current
        return rest
      })
      setFailedGameId(gameId)
    }
  }

  if (!weekId) return null

  const orderedGames = [...(games ?? [])].sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())

  return (
    <section>
      <h1 className="text-display-lg">Mis picks de playoffs</h1>
      <WeekSelector activeWeekId={weekId} linkTo={(id) => `/playoffs/${id}`} allowedSegments={['playoffs']} />

      {status === 'pending' && <LoadingSpinner variant="inline" label="Cargando partidos" />}
      {error && <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />}
      {games && games.length === 0 && <EmptyState message="Esta ronda todavía no tiene partidos cargados." />}

      <div className={styles.list}>
        {orderedGames.map((game) => (
          <PlayoffGameCard
            key={game.id}
            game={game}
            pick={picks[game.id] ?? null}
            result={resultsByGame.get(game.id) ?? null}
            locked={game.kickoffAt.getTime() <= nowMs}
            saveFailed={failedGameId === game.id}
            onPick={handlePick}
          />
        ))}
      </div>
    </section>
  )
}
