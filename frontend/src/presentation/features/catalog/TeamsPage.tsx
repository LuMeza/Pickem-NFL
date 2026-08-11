import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListResultsForGames } from '@/presentation/hooks/useListResultsForGames'
import { useNow } from '@/presentation/hooks/useNow'
import { computeTeamStanding, findNextGame } from '@/core/rules/computeTeamStanding'
import type { Game, Team } from '@/core/entities/catalog'
import type { GameResult } from '@/core/entities/gameResult'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { getReadableAccent } from '@/presentation/components/TeamBadge/teamColors'
import { DIVISION_ORDER, getTeamDivision } from '@/presentation/components/TeamBadge/teamDivisions'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import styles from './TeamsPage.module.css'

const NEXT_GAME_FORMAT = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

function teamMascot(name: string): string {
  return name.split(' ').pop() ?? name
}

function groupByDivision(teams: Team[]) {
  return DIVISION_ORDER.map(({ conference, division }) => ({
    conference,
    division,
    teams: teams
      .filter((team) => {
        const teamDivision = getTeamDivision(team.id)
        return teamDivision?.conference === conference && teamDivision.division === division
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.teams.length > 0)
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function TeamCard({
  team,
  games,
  results,
  nowMs,
  teamNameById,
}: {
  team: Team
  games: Game[]
  results: Map<string, GameResult>
  nowMs: number
  teamNameById: Map<string, string>
}) {
  const teamGames = useMemo(() => games.filter((game) => game.homeTeamId === team.id || game.awayTeamId === team.id), [games, team.id])
  const standing = useMemo(() => computeTeamStanding(team.id, teamGames, results), [team.id, teamGames, results])
  const nextGame = useMemo(() => findNextGame(team.id, teamGames, new Date(nowMs)), [team.id, teamGames, nowMs])
  const playedGames = standing.wins + standing.losses + standing.ties
  const accent = getReadableAccent(team.id)

  const nextGameLabel = useMemo(() => {
    if (!nextGame) return null
    const isHome = nextGame.homeTeamId === team.id
    const opponentId = isHome ? nextGame.awayTeamId : nextGame.homeTeamId
    const opponentMascot = teamMascot(teamNameById.get(opponentId) ?? opponentId)
    return `${isHome ? 'vs' : '@'} ${opponentMascot} · ${NEXT_GAME_FORMAT.format(nextGame.kickoffAt)}`
  }, [nextGame, team.id, teamNameById])

  return (
    <Link to={`/teams/${team.id}`} className={styles.teamCard} style={{ '--team-accent': accent } as CSSProperties}>
      <TeamBadge teamId={team.id} size="md" />
      <div className={styles.teamCardInfo}>
        <span className={styles.name}>{teamMascot(team.name)}</span>
        <span className={styles.teamCardMeta}>
          {playedGames > 0 ? (
            <span className={styles.record}>
              {standing.wins}-{standing.losses}
              {standing.ties > 0 ? `-${standing.ties}` : ''}
            </span>
          ) : (
            <span className={styles.recordEmpty}>Sin resultados</span>
          )}
          {nextGameLabel && <span className={styles.nextGame}>{nextGameLabel}</span>}
        </span>
      </div>
    </Link>
  )
}

/** Tarea 6.1 (base-plataforma): listado de equipos NFL agrupados por division. */
export function TeamsPage() {
  const { status, data: teams, error } = useSession().teams
  const { data: games } = useSession().games
  const { data: results, run: loadResults } = useListResultsForGames()
  const nowMs = useNow()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (games && games.length > 0) loadResults({ gameIds: games.map((game) => game.id) })
  }, [games, loadResults])

  const teamNameById = useMemo(() => new Map((teams ?? []).map((team) => [team.id, team.name])), [teams])
  const resultsByGame = useMemo(() => new Map((results ?? []).map((result) => [result.gameId, result])), [results])

  const normalizedQuery = normalize(query.trim())
  const filteredTeams = useMemo(
    () => (teams ?? []).filter((team) => normalize(team.name).includes(normalizedQuery)),
    [teams, normalizedQuery],
  )
  const groups = useMemo(() => groupByDivision(filteredTeams), [filteredTeams])

  return (
    <section>
      <span className="kicker">
        <Icon name="football" size={13} /> Catálogo NFL
      </span>
      <h1 className="text-display-lg">Equipos</h1>
      <p className="text-body-sm text-muted">Los 32 equipos de la NFL, con su record y su proximo partido.</p>

      <div className={styles.searchField}>
        <Icon name="search" size={14} className={styles.searchIcon} />
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Buscar equipo..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar equipo por nombre"
        />
      </div>

      {status === 'pending' && <LoadingSpinner variant="inline" label="Cargando equipos" />}
      {error && <p role="alert">No se pudieron cargar los equipos.</p>}
      {teams && normalizedQuery && filteredTeams.length === 0 && <EmptyState message="No se encontraron equipos." />}

      <div className={styles.divisionGrid}>
        {groups.map((group) => (
          <div key={`${group.conference}-${group.division}`} className={`${styles.divisionCard} glass-surface`}>
            <h2 className={styles.divisionTitle}>
              {group.conference} {group.division}
            </h2>
            <ul className={styles.divisionList}>
              {group.teams.map((team) => (
                <li key={team.id}>
                  <TeamCard
                    team={team}
                    games={games ?? []}
                    results={resultsByGame}
                    nowMs={nowMs}
                    teamNameById={teamNameById}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
