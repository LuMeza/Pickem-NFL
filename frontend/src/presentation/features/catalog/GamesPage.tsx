import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListResultsForGames } from '@/presentation/hooks/useListResultsForGames'
import { useListWeeklyPicksForWeek } from '@/presentation/hooks/useListWeeklyPicksForWeek'
import { useSaveWeeklyPick } from '@/presentation/hooks/useSaveWeeklyPick'
import { useNow } from '@/presentation/hooks/useNow'
import { isWeeklyPickLocked } from '@/core/rules/weeklyPickGroupDeadline'
import { getGameLiveStatus } from '@/core/rules/getGameLiveStatus'
import type { Game, WeekType } from '@/core/entities/catalog'
import type { WeeklyPickValue } from '@/core/ports/WeeklyPickRepository'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { WeekSelector } from '@/presentation/components/WeekSelector/WeekSelector'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { PickRow, type GamePickView } from './pickSheet/PickRow'
import { PickProgress } from './pickSheet/PickProgress'
import styles from './GamesPage.module.css'

/** Nadie hizo picks en HOF ni pretemporada — esta pantalla es "Tu pick de la semana" de
 * Pickem semanal, no el calendario completo (ver CalendarPage, que sí muestra todo). */
const ALLOWED_SEGMENTS: WeekType[] = ['regular', 'playoffs']

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

interface KickoffSlot {
  key: string
  label: string
  views: GamePickView[]
}

/** Dentro de un día, agrupa por hora de kickoff para no repetir la hora en cada renglón. */
function groupByKickoff(views: GamePickView[]): KickoffSlot[] {
  const slots: KickoffSlot[] = []
  for (const view of views) {
    const key = String(view.game.kickoffAt.getTime())
    const last = slots[slots.length - 1]
    if (last && last.key === key) last.views.push(view)
    else
      slots.push({
        key,
        label: view.game.kickoffAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        views: [view],
      })
  }
  return slots
}

function DayGroupSection({
  group,
  viewsByGame,
  teamName,
  failedGameId,
  onPick,
}: {
  group: DayGroup
  viewsByGame: Map<string, GamePickView>
  teamName: (id: string) => string
  failedGameId: string | null
  onPick: (gameId: string, pick: WeeklyPickValue) => void
}) {
  const dayName = capitalize(group.date.toLocaleDateString('es-MX', { weekday: 'long' }))
  const dayDate = group.date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  const slots = groupByKickoff(group.games.map((game) => viewsByGame.get(game.id)!))

  return (
    <div className={styles.dayGroup}>
      <div className={styles.dayHeader}>
        <span className={styles.dayName}>{dayName}</span>
        <span className={styles.dayDate}>{dayDate}</span>
        <span className={styles.dayCount}>
          {group.games.length} {group.games.length === 1 ? 'partido' : 'partidos'}
        </span>
      </div>
      {slots.map((slot) => (
        <div key={slot.key} className={styles.slot}>
          <span className={styles.kickoffTime}>{slot.label}</span>
          <div className={styles.rows}>
            {slot.views.map((view) => (
              <PickRow
                key={view.game.id}
                view={view}
                teamName={teamName}
                saveFailed={failedGameId === view.game.id}
                onPick={onPick}
              />
            ))}
          </div>
        </div>
      ))}
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
  const now = new Date(nowMs)
  const orderedViews: GamePickView[] = dayGroups.flatMap((day) =>
    day.games.map((game) => {
      const pickedValue = picks[game.id] ?? null
      const result = resultsByGame.get(game.id) ?? null
      const liveStatus = getGameLiveStatus(game, result, now)
      const isFinal = liveStatus === 'final' && result !== null
      return {
        game,
        pickedValue,
        result,
        isFinal,
        isLive: liveStatus === 'live',
        locked: !canPredict || isWeeklyPickLocked(weekGames, game, now),
        correct: isFinal && pickedValue ? pickedValue === result.outcome : null,
      }
    }),
  )
  const viewsByGame = new Map(orderedViews.map((view) => [view.game.id, view]))

  return (
    <section>
      <span className="kicker">
        <Icon name="football" size={13} /> Pickem semanal
      </span>
      <h1 className="text-display-lg">Tu pick de la semana</h1>
      <WeekSelector activeWeekId={weekId} allowedSegments={ALLOWED_SEGMENTS} />

      {isPlayoffsWeek && (
        <p className="text-body-sm text-muted">El pickem semanal no aplica a semanas de playoffs.</p>
      )}

      {status === 'pending' && <LoadingSpinner variant="inline" label="Cargando partidos" />}
      {error && <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />}
      {games && games.length === 0 && <EmptyState message="Esta semana todavía no tiene partidos cargados." />}
      {orderedViews.length > 0 && canPredict && (
        <PickProgress views={orderedViews} weekGames={weekGames} nowMs={nowMs} />
      )}
      <div className={styles.agenda}>
        {dayGroups.map((group) => (
          <DayGroupSection
            key={group.key}
            group={group}
            viewsByGame={viewsByGame}
            teamName={teamName}
            failedGameId={failedGameId}
            onPick={handlePick}
          />
        ))}
      </div>
    </section>
  )
}
