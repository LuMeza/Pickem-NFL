import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListResultsForGames } from '@/presentation/hooks/useListResultsForGames'
import { useNow } from '@/presentation/hooks/useNow'
import { getGameLiveStatus } from '@/core/rules/getGameLiveStatus'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { getTeamColors } from '@/presentation/components/TeamBadge/teamColors'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import type { Game } from '@/core/entities/catalog'
import styles from './UpcomingGamesStrip.module.css'

const MAX_FEATURED_GAMES = 6

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

function formatKickoffLabel(kickoffAt: Date, now: Date): string {
  const time = kickoffAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  if (isSameDay(kickoffAt, now)) return `Hoy · ${time}`

  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  if (isSameDay(kickoffAt, tomorrow)) return `Mañana · ${time}`

  const day = kickoffAt.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
  return `${day} · ${time}`
}

/** Partidos en vivo y los próximos por arrancar, de un vistazo desde el inicio — no reemplaza el calendario, solo adelanta lo inmediato. */
export function UpcomingGamesStrip() {
  const { games: gamesResource, teams: teamsResource } = useSession()
  const { status: gamesStatus, data: games } = gamesResource
  const { data: teams } = teamsResource
  const { data: results, run: loadResults } = useListResultsForGames()
  const nowMs = useNow()

  useEffect(() => {
    if (games && games.length > 0) loadResults({ gameIds: games.map((game) => game.id) })
  }, [games, loadResults])

  const resultsByGame = new Map((results ?? []).map((result) => [result.gameId, result]))
  const teamNames = new Map((teams ?? []).map((team) => [team.id, team.name]))
  const teamName = (id: string) => teamNames.get(id) ?? id
  const now = new Date(nowMs)

  const withStatus = (games ?? []).map((game) => ({
    game,
    status: getGameLiveStatus(game, resultsByGame.get(game.id) ?? null, now),
  }))

  const live = withStatus
    .filter((entry) => entry.status === 'live')
    .sort((a, b) => a.game.kickoffAt.getTime() - b.game.kickoffAt.getTime())
  const upcoming = withStatus
    .filter((entry) => entry.status === 'scheduled' && entry.game.kickoffAt.getTime() > nowMs)
    .sort((a, b) => a.game.kickoffAt.getTime() - b.game.kickoffAt.getTime())

  const featured = [...live, ...upcoming].slice(0, MAX_FEATURED_GAMES)

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Próximos partidos</h2>
      {gamesStatus === 'idle' || gamesStatus === 'pending' ? (
        <LoadingSpinner variant="inline" label="Cargando partidos" />
      ) : gamesStatus === 'error' ? (
        <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />
      ) : featured.length === 0 ? (
        <EmptyState message={EMPTY_STATE_COPY.noUpcomingGames} />
      ) : (
        <div className={styles.strip}>
          {featured.map(({ game, status }) => (
            <FeaturedGameCard key={game.id} game={game} isLive={status === 'live'} now={now} teamName={teamName} />
          ))}
        </div>
      )}
    </div>
  )
}

function TeamRow({ teamId, name }: { teamId: string; name: string }) {
  return (
    <span className={styles.teamRow}>
      <TeamBadge teamId={teamId} size="sm" />
      <span className={styles.teamName}>{name}</span>
    </span>
  )
}

function FeaturedGameCard({
  game,
  isLive,
  now,
  teamName,
}: {
  game: Game
  isLive: boolean
  now: Date
  teamName: (id: string) => string
}) {
  const accentStyle = {
    '--home-color': getTeamColors(game.homeTeamId).primary,
    '--away-color': getTeamColors(game.awayTeamId).primary,
  } as CSSProperties

  return (
    <Link
      to={`/weeks/${game.weekId}/games`}
      className={`${styles.card} glass-surface glass-interactive`}
      style={accentStyle}
    >
      <span className={`${styles.statusPill} ${isLive ? styles.statusLive : styles.statusUpcoming}`}>
        {isLive && <span className={styles.liveDot} aria-hidden="true" />}
        {isLive ? 'En vivo' : formatKickoffLabel(game.kickoffAt, now)}
      </span>
      <span className={styles.matchup}>
        <TeamRow teamId={game.homeTeamId} name={teamName(game.homeTeamId)} />
        <span className={styles.at}>vs</span>
        <TeamRow teamId={game.awayTeamId} name={teamName(game.awayTeamId)} />
      </span>
    </Link>
  )
}
