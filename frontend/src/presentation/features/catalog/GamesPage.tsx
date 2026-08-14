import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListResultsForGames } from '@/presentation/hooks/useListResultsForGames'
import { useListWeeklyPicksForWeek } from '@/presentation/hooks/useListWeeklyPicksForWeek'
import { useSaveWeeklyPick } from '@/presentation/hooks/useSaveWeeklyPick'
import { useNow } from '@/presentation/hooks/useNow'
import { isWeeklyPickLocked, weeklyPickGroupDeadline } from '@/core/rules/weeklyPickGroupDeadline'
import { getGameLiveStatus } from '@/core/rules/getGameLiveStatus'
import { formatLivePeriod } from '@/core/rules/formatLivePeriod'
import type { Game } from '@/core/entities/catalog'
import type { GameResult } from '@/core/entities/gameResult'
import type { WeeklyPickValue } from '@/core/ports/WeeklyPickRepository'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { getReadableAccent } from '@/presentation/components/TeamBadge/teamColors'
import { WeekSelector } from '@/presentation/components/WeekSelector/WeekSelector'
import { PredictionCard, type PredictionCardStatus } from '@/presentation/components/PredictionCard/PredictionCard'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import styles from './GamesPage.module.css'

const URGENT_THRESHOLD_MS = 2 * 60 * 60 * 1000

function outcomeLabel(result: GameResult, game: Game, teamName: (id: string) => string): string {
  if (result.outcome === 'tie') return 'Empate'
  const winnerId = result.outcome === 'home' ? game.homeTeamId : game.awayTeamId
  return teamName(winnerId)
}

interface DayGroup {
  key: string
  date: Date
  games: Game[]
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Agrupa partidos por día calendario (hora local) y ordena días y partidos cronologicamente. */
function groupGamesByDay(games: Game[]): DayGroup[] {
  const byDay = new Map<string, Game[]>()
  for (const game of games) {
    const key = game.kickoffAt.toDateString()
    const bucket = byDay.get(key)
    if (bucket) bucket.push(game)
    else byDay.set(key, [game])
  }
  return Array.from(byDay.entries())
    .map(([key, dayGames]) => ({
      key,
      date: dayGames[0]!.kickoffAt,
      games: [...dayGames].sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime()),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

function GameProposal({
  game,
  teamName,
  nowMs,
  canPredict,
  weekGames,
  pickedValue,
  result,
  saveFailed,
  onPick,
}: {
  game: Game
  teamName: (id: string) => string
  nowMs: number
  canPredict: boolean
  weekGames: Game[]
  pickedValue: WeeklyPickValue | null
  result: GameResult | null
  saveFailed: boolean
  onPick: (gameId: string, pick: WeeklyPickValue) => void
}) {
  const liveStatus = getGameLiveStatus(game, result, new Date(nowMs))
  const hasResult = liveStatus === 'final'
  const isLive = liveStatus === 'live'
  const bucketLocked = isWeeklyPickLocked(weekGames, game, new Date(nowMs))
  const locked = bucketLocked || !canPredict

  let status: PredictionCardStatus
  let correct: boolean | undefined
  if (hasResult && result) {
    if (pickedValue) {
      status = 'closed'
      correct = pickedValue === result.outcome
    } else {
      status = 'locked'
    }
  } else if (locked) {
    status = 'locked'
  } else if (pickedValue) {
    status = 'picked'
  } else {
    status = 'unpicked'
  }
  const groupDeadline = weeklyPickGroupDeadline(weekGames, game.kickoffAt)
  const urgent =
    status === 'picked' && groupDeadline !== null && groupDeadline.getTime() - nowMs < URGENT_THRESHOLD_MS
  const pickedAccent =
    pickedValue === 'home'
      ? getReadableAccent(game.homeTeamId)
      : pickedValue === 'away'
        ? getReadableAccent(game.awayTeamId)
        : undefined

  const kickoffLabel = game.kickoffAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const statusLabel = hasResult
    ? `Final · ${outcomeLabel(result!, game, teamName)}`
    : isLive
      ? 'En vivo'
      : bucketLocked
        ? 'Cerrado'
        : 'Abierto'
  const pillClass = hasResult ? styles.resultDone : isLive ? styles.resultLive : styles.resultPending

  return (
    <div className={styles.gameSlot}>
      <div className={styles.gameMetaRow}>
        <span className={styles.kickoffTime}>{kickoffLabel}</span>
        <span className={`${styles.statusPill} ${pillClass}`}>
          {isLive && <span className={styles.liveDot} aria-hidden="true" />}
          {statusLabel}
        </span>
      </div>
      {hasResult && result && (
        <div className={styles.scoreboard}>
          <span className={styles.scoreboardTeam}>{game.homeTeamId}</span>
          <span className={styles.scoreboardValue}>
            {result.homeScore}&nbsp;–&nbsp;{result.awayScore}
          </span>
          <span className={styles.scoreboardTeam}>{game.awayTeamId}</span>
        </div>
      )}
      {!hasResult && isLive && (
        <div className={styles.scoreboard}>
          <span className={styles.liveDot} aria-hidden="true" />
          <span className={`${styles.scoreboardValue} ${styles.scoreboardLive}`}>
            {formatLivePeriod(game.livePeriod) ?? 'En vivo'}
          </span>
        </div>
      )}
      <PredictionCard
        variant="triple"
        status={status}
        selectedOptionId={pickedValue}
        correct={correct}
        urgent={urgent}
        pickedAccent={pickedAccent}
        onSelect={(optionId) => onPick(game.id, optionId as WeeklyPickValue)}
        options={[
          {
            id: 'home',
            label: teamName(game.homeTeamId),
            logo: <TeamBadge teamId={game.homeTeamId} size="md" />,
          },
          { id: 'tie', label: 'Empate' },
          {
            id: 'away',
            label: teamName(game.awayTeamId),
            logo: <TeamBadge teamId={game.awayTeamId} size="md" />,
          },
        ]}
      />
      {saveFailed && (
        <p className={`${styles.pickError} text-body-sm`} role="alert">
          No se pudo guardar tu pick. Intenta de nuevo.
        </p>
      )}
    </div>
  )
}

function DayGroupSection({
  group,
  teamName,
  nowMs,
  canPredict,
  weekGames,
  picks,
  resultsByGame,
  failedGameId,
  onPick,
}: {
  group: DayGroup
  teamName: (id: string) => string
  nowMs: number
  canPredict: boolean
  weekGames: Game[]
  picks: Record<string, WeeklyPickValue>
  resultsByGame: Map<string, GameResult>
  failedGameId: string | null
  onPick: (gameId: string, pick: WeeklyPickValue) => void
}) {
  const dayName = capitalize(group.date.toLocaleDateString('es-MX', { weekday: 'long' }))
  const dayDate = group.date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })

  return (
    <div className={styles.dayGroup}>
      <div className={styles.dayHeader}>
        <span className={styles.dayName}>{dayName}</span>
        <span className={styles.dayDate}>{dayDate}</span>
        <span className={styles.dayCount}>
          {group.games.length} {group.games.length === 1 ? 'partido' : 'partidos'}
        </span>
      </div>
      <div className="games-grid">
        {group.games.map((game) => (
          <GameProposal
            key={game.id}
            game={game}
            teamName={teamName}
            nowMs={nowMs}
            canPredict={canPredict}
            weekGames={weekGames}
            pickedValue={picks[game.id] ?? null}
            result={resultsByGame.get(game.id) ?? null}
            saveFailed={failedGameId === game.id}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  )
}

/** Tareas 6.3/7.4 (base-plataforma) y 3.1-3.5 (modulo-pickem-semanal): partidos de una semana, agrupados por día, con guardado real de predicciones. */
export function GamesPage() {
  const { weekId } = useParams<{ weekId: string }>()
  const { status, data: games, error, run: loadGames } = useListGamesForWeek()
  const { teams: teamsResource, weeks: weeksResource, group: groupResource, profile: profileResource } = useSession()
  const { data: teams } = teamsResource
  const { data: weeks } = weeksResource
  const { data: group } = groupResource
  const { data: profile } = profileResource
  const { data: loadedPicks, run: loadPicks } = useListWeeklyPicksForWeek()
  const { data: results, run: loadResults } = useListResultsForGames()
  const { run: savePick } = useSaveWeeklyPick()
  const [teamNames] = useState(() => new Map<string, string>())
  const [picks, setPicks] = useState<Record<string, WeeklyPickValue>>({})
  const [failedGameId, setFailedGameId] = useState<string | null>(null)
  const nowMs = useNow()

  useEffect(() => {
    if (weekId) loadGames({ weekId })
  }, [weekId, loadGames])

  useEffect(() => {
    if (group && profile && weekId) {
      loadPicks({ userId: profile.userId, weekId })
    }
  }, [group, profile, weekId, loadPicks])

  useEffect(() => {
    if (games && games.length > 0) loadResults({ gameIds: games.map((game) => game.id) })
  }, [games, loadResults])

  useEffect(() => {
    if (loadedPicks) setPicks(loadedPicks)
  }, [loadedPicks])

  teams?.forEach((team) => teamNames.set(team.id, team.name))
  const teamName = (id: string) => teamNames.get(id) ?? id

  const resultsByGame = useMemo(() => new Map((results ?? []).map((result) => [result.gameId, result])), [results])

  const activeWeek = weeks?.find((week) => week.id === weekId)
  const isPlayoffsWeek = activeWeek?.type === 'playoffs'
  const canPredict = !isPlayoffsWeek
  const weekGames = games ?? []

  async function handlePick(gameId: string, pick: WeeklyPickValue) {
    if (!group || !profile || !canPredict) return
    const previous = picks[gameId] ?? null
    setPicks((current) => ({ ...current, [gameId]: pick }))
    setFailedGameId(null)
    try {
      await savePick({ groupId: group.id, userId: profile.userId, gameId, pick })
    } catch {
      setPicks((current) => (previous ? { ...current, [gameId]: previous } : current))
      setFailedGameId(gameId)
    }
  }

  if (!weekId) return null

  const dayGroups = games ? groupGamesByDay(games) : []

  return (
    <section>
      <span className="kicker">
        <Icon name="football" size={13} /> Pickem semanal
      </span>
      <h1 className="text-display-lg">Tu pick de la semana</h1>
      <WeekSelector activeWeekId={weekId} />

      {isPlayoffsWeek && (
        <p className="text-body-sm text-muted">El pickem semanal no aplica a semanas de playoffs.</p>
      )}

      {status === 'pending' && <LoadingSpinner variant="inline" label="Cargando partidos" />}
      {error && <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />}
      {games && games.length === 0 && <EmptyState message="Esta semana todavía no tiene partidos cargados." />}
      <div className={styles.agenda}>
        {dayGroups.map((group) => (
          <DayGroupSection
            key={group.key}
            group={group}
            teamName={teamName}
            nowMs={nowMs}
            canPredict={canPredict}
            weekGames={weekGames}
            picks={picks}
            resultsByGame={resultsByGame}
            failedGameId={failedGameId}
            onPick={handlePick}
          />
        ))}
      </div>
    </section>
  )
}
