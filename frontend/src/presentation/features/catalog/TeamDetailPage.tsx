import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useListTeams } from '@/presentation/hooks/useListTeams'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
import { useListGamesForTeam } from '@/presentation/hooks/useListGamesForTeam'
import { useListPlayersForTeam } from '@/presentation/hooks/useListPlayersForTeam'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { PlayerPhoto } from '@/presentation/components/PlayerPhoto/PlayerPhoto'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { Icon } from '@/presentation/components/Icon/Icon'
import { POSITION_LABEL, getPositionLabel } from './nflPositions'
import type { Game, Player, Week, WeekType } from '@/core/entities/catalog'
import styles from './TeamDetailPage.module.css'

const SECTION_LABEL: Record<WeekType, string> = {
  hof: 'Hall of Fame',
  pretemporada: 'Pretemporada',
  regular: 'Temporada regular',
  playoffs: 'Playoffs',
}

const PLAYOFFS_ROUND_LABEL: Record<number, string> = {
  1: 'Wild Card',
  2: 'Divisional',
  3: 'Conference',
  4: 'Super Bowl',
}

function weekLabel(week: Week | undefined): string {
  if (!week) return ''
  if (week.type === 'playoffs') return PLAYOFFS_ROUND_LABEL[week.number] ?? `Ronda ${week.number}`
  if (week.type === 'hof') return 'Hall of Fame'
  if (week.type === 'pretemporada') return `Pretemporada ${week.number}`
  return `Semana ${week.number}`
}

const KICKOFF_FORMAT = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

function formatKickoff(date: Date): string {
  return KICKOFF_FORMAT.format(date)
}

function groupGamesByWeekType(games: Game[], weekById: Map<string, Week>): [WeekType, Game[]][] {
  const sections: WeekType[] = ['hof', 'pretemporada', 'regular', 'playoffs']
  return sections
    .map((type): [WeekType, Game[]] => [type, games.filter((game) => weekById.get(game.weekId)?.type === type)])
    .filter(([, sectionGames]) => sectionGames.length > 0)
}

const UNIT_LABEL: Record<string, string> = {
  offense: 'Ofensiva',
  defense: 'Defensiva',
  specialTeam: 'Equipos especiales',
}

function unitLabel(unit: string | null): string {
  return unit ? (UNIT_LABEL[unit] ?? unit) : 'Sin clasificar'
}

function groupPlayersByUnit(players: Player[]): [string, Player[]][] {
  const groups = new Map<string, Player[]>()
  for (const player of players) {
    const key = unitLabel(player.unit)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(player)
  }
  return Array.from(groups.entries())
}

type Tab = 'calendario' | 'plantilla'

/** Detalle de equipo: plantilla (roster) y calendario de partidos — se abre al hacer click en un equipo desde /teams. */
export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const [tab, setTab] = useState<Tab>('calendario')
  const { data: teams, run: loadTeams } = useListTeams()
  const { data: weeks, run: loadWeeks } = useListWeeks()
  const { status: gamesStatus, data: games, error: gamesError, run: loadGames } = useListGamesForTeam()
  const { status: playersStatus, data: players, error: playersError, run: loadPlayers } = useListPlayersForTeam()

  useEffect(() => {
    if (!teamId) return
    loadTeams()
    loadWeeks()
    loadGames({ teamId })
    loadPlayers({ teamId })
  }, [teamId, loadTeams, loadWeeks, loadGames, loadPlayers])

  const teamName = useMemo(() => teams?.find((team) => team.id === teamId)?.name ?? teamId ?? '', [teams, teamId])
  const weekById = useMemo(() => new Map((weeks ?? []).map((week) => [week.id, week])), [weeks])
  const teamNameById = useMemo(() => new Map((teams ?? []).map((team) => [team.id, team.name])), [teams])
  const gameSections = useMemo(() => groupGamesByWeekType(games ?? [], weekById), [games, weekById])
  const playerGroups = useMemo(() => groupPlayersByUnit(players ?? []), [players])

  if (!teamId) return null

  return (
    <section>
      <Link to="/teams" className={styles.backLink}>
        <Icon name="arrowLeft" size={14} /> Equipos
      </Link>

      <div className={styles.header}>
        <TeamBadge teamId={teamId} size="lg" />
        <h1 className="text-display-lg">{teamName}</h1>
      </div>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'calendario'}
          className={`${styles.tab} ${tab === 'calendario' ? styles.tabActive : ''}`}
          onClick={() => setTab('calendario')}
        >
          Calendario
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'plantilla'}
          className={`${styles.tab} ${tab === 'plantilla' ? styles.tabActive : ''}`}
          onClick={() => setTab('plantilla')}
        >
          Plantilla
        </button>
      </div>

      {tab === 'calendario' && (
        <div role="tabpanel">
          {gamesStatus === 'pending' && <p>Cargando calendario...</p>}
          {gamesError && <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />}
          {games && games.length === 0 && <EmptyState message="Este equipo todavia no tiene partidos cargados." />}
          {gameSections.map(([type, sectionGames]) => (
            <div key={type} className={styles.gameSection}>
              <h3 className={styles.gameSectionTitle}>{SECTION_LABEL[type]}</h3>
              <div className={styles.gameList}>
                {sectionGames.map((game) => {
                  const isHome = game.homeTeamId === teamId
                  const opponentId = isHome ? game.awayTeamId : game.homeTeamId
                  return (
                    <div key={game.id} className={`${styles.gameCard} glass-surface`}>
                      <TeamBadge teamId={opponentId} size="md" />
                      <div className={styles.gameInfo}>
                        <span className={styles.gameMatchup}>
                          {isHome ? 'Recibe a' : 'Visita a'} {teamNameById.get(opponentId) ?? opponentId}
                        </span>
                        <span className={styles.gameWeek}>
                          {weekLabel(weekById.get(game.weekId))} · {isHome ? 'de local' : 'de visitante'}
                        </span>
                      </div>
                      <span className={styles.gameKickoff}>{formatKickoff(game.kickoffAt)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'plantilla' && (
        <div role="tabpanel">
          {playersStatus === 'pending' && <p>Cargando plantilla...</p>}
          {playersError && <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />}
          {players && players.length === 0 && (
            <EmptyState message="Todavia no se ha sincronizado la plantilla de este equipo." />
          )}
          {players && players.length > 0 && (
            <details className={styles.glossary}>
              <summary>¿Qué significan las posiciones?</summary>
              <dl className={styles.glossaryList}>
                {Object.entries(POSITION_LABEL).map(([abbreviation, label]) => (
                  <div key={abbreviation} className={styles.glossaryItem}>
                    <dt>{abbreviation}</dt>
                    <dd>{label}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
          {playerGroups.map(([unit, unitPlayers]) => (
            <div key={unit} className={styles.unitSection}>
              <h3 className={styles.unitTitle}>{unit}</h3>
              <div className={styles.playerGrid}>
                {unitPlayers.map((player) => (
                  <div key={player.id} className={`${styles.playerCard} glass-surface`}>
                    <PlayerPhoto playerId={player.id} jerseyNumber={player.jerseyNumber} />
                    <span className={styles.playerName}>{player.fullName}</span>
                    <span className={styles.playerMeta}>
                      {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}{' '}
                      <span title={getPositionLabel(player.position) ?? undefined}>{player.position ?? ''}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
