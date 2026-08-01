import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useListTeams } from '@/presentation/hooks/useListTeams'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
import { useGetGameResult } from '@/presentation/hooks/useGetGameResult'
import { useDefaultGroup } from '@/presentation/hooks/useDefaultGroup'
import { useGetProfile } from '@/presentation/hooks/useGetProfile'
import { useGetWeeklyAccessStatus } from '@/presentation/hooks/useGetWeeklyAccessStatus'
import { useListWeeklyPicksForWeek } from '@/presentation/hooks/useListWeeklyPicksForWeek'
import { useSaveWeeklyPick } from '@/presentation/hooks/useSaveWeeklyPick'
import { isPredictionLocked } from '@/core/rules/isPredictionLocked'
import type { Game } from '@/core/entities/catalog'
import type { WeeklyPickValue } from '@/core/ports/WeeklyPickRepository'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { getTeamColors } from '@/presentation/components/TeamBadge/teamColors'
import { WeekSelector } from '@/presentation/components/WeekSelector/WeekSelector'
import { PredictionCard, type PredictionCardStatus } from '@/presentation/components/PredictionCard/PredictionCard'
import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './GamesPage.module.css'

const NOW_REFRESH_MS = 30_000
const URGENT_THRESHOLD_MS = 2 * 60 * 60 * 1000
/** Un partido de NFL dura ~3h en cancha — mientras no haya resultado cargado, lo tratamos como "en vivo" en esta ventana desde el kickoff. */
const LIVE_WINDOW_MS = 4 * 60 * 60 * 1000

const OUTCOME_LABEL: Record<string, string> = { home: 'Gano local', away: 'Gano visita', tie: 'Empate' }

interface DayGroup {
  key: string
  date: Date
  games: Game[]
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Agrupa partidos por dia calendario (hora local) y ordena dias y partidos cronologicamente. */
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

/** Refresca cada NOW_REFRESH_MS para recalcular bloqueo/urgencia de picks sin un timer por tarjeta. */
function useNow(): number {
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const intervalId = setInterval(() => setNowMs(Date.now()), NOW_REFRESH_MS)
    return () => clearInterval(intervalId)
  }, [])
  return nowMs
}

function GameProposal({
  game,
  teamName,
  nowMs,
  canPredict,
  pickedValue,
  onPick,
}: {
  game: Game
  teamName: (id: string) => string
  nowMs: number
  canPredict: boolean
  pickedValue: WeeklyPickValue | null
  onPick: (gameId: string, pick: WeeklyPickValue) => void
}) {
  const { data: result, run } = useGetGameResult()

  useEffect(() => {
    run({ gameId: game.id })
  }, [run, game.id])

  const hasResult = result != null && result.homeScore !== null && result.awayScore !== null
  const kickoffPassed = isPredictionLocked(game, new Date(nowMs))
  const locked = kickoffPassed || !canPredict
  const msSinceKickoff = nowMs - game.kickoffAt.getTime()
  const isLive = kickoffPassed && !hasResult && msSinceKickoff < LIVE_WINDOW_MS

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
  const urgent = status === 'picked' && game.kickoffAt.getTime() - nowMs < URGENT_THRESHOLD_MS
  const pickedAccent =
    pickedValue === 'home'
      ? getTeamColors(game.homeTeamId).primary
      : pickedValue === 'away'
        ? getTeamColors(game.awayTeamId).primary
        : undefined

  const kickoffLabel = game.kickoffAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const statusLabel = hasResult
    ? `Final · ${OUTCOME_LABEL[result!.outcome]}`
    : isLive
      ? 'En vivo'
      : kickoffPassed
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
          <span className={`${styles.scoreboardValue} ${styles.scoreboardLive}`}>En vivo</span>
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
          { id: 'home', label: teamName(game.homeTeamId), logo: <TeamBadge teamId={game.homeTeamId} size="md" /> },
          { id: 'tie', label: 'Empate' },
          { id: 'away', label: teamName(game.awayTeamId), logo: <TeamBadge teamId={game.awayTeamId} size="md" /> },
        ]}
      />
    </div>
  )
}

function DayGroupSection({
  group,
  teamName,
  nowMs,
  canPredict,
  picks,
  onPick,
}: {
  group: DayGroup
  teamName: (id: string) => string
  nowMs: number
  canPredict: boolean
  picks: Record<string, WeeklyPickValue>
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
            pickedValue={picks[game.id] ?? null}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  )
}

/** Tareas 6.3/7.4 (base-plataforma) y 3.1-3.5 (modulo-pickem-semanal): partidos de una semana, agrupados por dia, con guardado real de predicciones condicionado a acceso semanal aprobado. */
export function GamesPage() {
  const { weekId } = useParams<{ weekId: string }>()
  const { status, data: games, error, run: loadGames } = useListGamesForWeek()
  const { data: teams, run: loadTeams } = useListTeams()
  const { data: weeks, run: loadWeeks } = useListWeeks()
  const { data: group, run: loadGroup } = useDefaultGroup()
  const { data: profile, run: loadProfile } = useGetProfile()
  const { data: accessStatus, run: loadAccessStatus } = useGetWeeklyAccessStatus()
  const { data: loadedPicks, run: loadPicks } = useListWeeklyPicksForWeek()
  const { run: savePick } = useSaveWeeklyPick()
  const [teamNames] = useState(() => new Map<string, string>())
  const [picks, setPicks] = useState<Record<string, WeeklyPickValue>>({})
  const nowMs = useNow()

  useEffect(() => {
    if (weekId) loadGames({ weekId })
    loadTeams()
    loadWeeks()
    loadGroup()
    loadProfile()
  }, [weekId, loadGames, loadTeams, loadWeeks, loadGroup, loadProfile])

  useEffect(() => {
    if (group && profile && weekId) {
      loadAccessStatus({ groupId: group.id, userId: profile.userId, weekId })
      loadPicks({ userId: profile.userId, weekId })
    }
  }, [group, profile, weekId, loadAccessStatus, loadPicks])

  useEffect(() => {
    if (loadedPicks) setPicks(loadedPicks)
  }, [loadedPicks])

  teams?.forEach((team) => teamNames.set(team.id, team.name))
  const teamName = (id: string) => teamNames.get(id) ?? id

  const activeWeek = weeks?.find((week) => week.id === weekId)
  const isPlayoffsWeek = activeWeek?.type === 'playoffs'
  const canPredict = accessStatus === 'aprobado' && !isPlayoffsWeek

  async function handlePick(gameId: string, pick: WeeklyPickValue) {
    if (!group || !profile || !canPredict) return
    const previous = picks[gameId] ?? null
    setPicks((current) => ({ ...current, [gameId]: pick }))
    try {
      await savePick({ groupId: group.id, userId: profile.userId, gameId, pick })
    } catch {
      setPicks((current) => (previous ? { ...current, [gameId]: previous } : current))
    }
  }

  if (!weekId) return null

  const dayGroups = games ? groupGamesByDay(games) : []

  return (
    <section>
      <span className="kicker">
        <Icon name="football" size={13} /> Pickem semanal
      </span>
      <h1 className="text-display-lg">Propuestas de la semana</h1>
      <WeekSelector activeWeekId={weekId} />

      {isPlayoffsWeek && (
        <p className="text-body-sm text-muted">El pickem semanal no aplica a semanas de playoffs.</p>
      )}
      {!isPlayoffsWeek && accessStatus !== 'aprobado' && (
        <p className="text-body-sm text-muted">
          No tienes acceso aprobado al pickem de esta semana.{' '}
          <Link to={`/pickem/acceso/${weekId}`}>Solicitar acceso</Link>
        </p>
      )}

      {status === 'pending' && <p>Cargando partidos...</p>}
      {error && <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />}
      {games && games.length === 0 && <EmptyState message="Esta semana todavia no tiene partidos cargados." />}
      <div className={styles.agenda}>
        {dayGroups.map((group) => (
          <DayGroupSection
            key={group.key}
            group={group}
            teamName={teamName}
            nowMs={nowMs}
            canPredict={canPredict}
            picks={picks}
            onPick={handlePick}
          />
        ))}
      </div>
    </section>
  )
}
