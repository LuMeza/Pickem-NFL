import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListGamesForTeam } from '@/presentation/hooks/useListGamesForTeam'
import { useListPlayersForTeam } from '@/presentation/hooks/useListPlayersForTeam'
import { useListResultsForGames } from '@/presentation/hooks/useListResultsForGames'
import { useNow } from '@/presentation/hooks/useNow'
import { computeTeamStanding, findNextGame } from '@/core/rules/computeTeamStanding'
import { getGameLiveStatus } from '@/core/rules/getGameLiveStatus'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { getReadableAccent, getTeamColors } from '@/presentation/components/TeamBadge/teamColors'
import { getTeamDivision } from '@/presentation/components/TeamBadge/teamDivisions'
import { PlayerCard } from '@/presentation/components/PlayerCard/PlayerCard'
import { getAvailability, type AvailabilityTone } from '@/presentation/features/catalog/playerAvailability'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { POSITION_LABEL } from './nflPositions'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import type { Game, Player, Week, WeekType } from '@/core/entities/catalog'
import styles from './TeamDetailPage.module.css'

const SECTION_LABEL: Record<WeekType, string> = {
  hof: 'Hall of Fame',
  pretemporada: 'Pretemporada',
  regular: 'Temporada regular',
  playoffs: 'Playoffs',
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

type UnitKey = 'offense' | 'defense' | 'specialTeam' | 'unclassified'

const UNIT_ORDER: UnitKey[] = ['offense', 'defense', 'specialTeam', 'unclassified']

const UNIT_LABEL: Record<UnitKey, string> = {
  offense: 'Ofensiva',
  defense: 'Defensiva',
  specialTeam: 'Equipos especiales',
  unclassified: 'Sin clasificar',
}

function unitKeyOf(unit: string | null): UnitKey {
  return unit === 'offense' || unit === 'defense' || unit === 'specialTeam' ? unit : 'unclassified'
}

type AvailabilityFilter = AvailabilityTone
const AVAILABILITY_FILTER_ORDER: AvailabilityFilter[] = ['questionable', 'injured', 'active']
const AVAILABILITY_FILTER_LABEL: Record<AvailabilityFilter, string> = {
  active: 'Activo',
  questionable: 'Cuestionable',
  injured: 'Lesionado',
}
const AVAILABILITY_FILTER_CSS_VAR: Record<AvailabilityFilter, string> = {
  active: 'var(--status-active)',
  questionable: 'var(--status-questionable)',
  injured: 'var(--status-injured)',
}

// Rango Unicode U+0300-U+036F (marcas diacriticas combinantes) que separa
// `normalize('NFD')` de una vocal con acento — se quitan para que la
// busqueda encuentre "Jose" al escribir "jose" sin tilde.
const COMBINING_DIACRITICS = /[̀-ͯ]/g

function normalize(value: string): string {
  return value.normalize('NFD').replace(COMBINING_DIACRITICS, '').toLowerCase()
}

function filterPlayersByName(players: Player[], query: string): Player[] {
  const normalizedQuery = normalize(query.trim())
  if (!normalizedQuery) return players
  return players.filter((player) => normalize(player.fullName).includes(normalizedQuery))
}

type Tab = 'calendario' | 'plantilla'

/** Detalle de equipo: plantilla (roster) y calendario de partidos — se abre al hacer click en un equipo desde /teams. */
export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const [tab, setTab] = useState<Tab>('calendario')
  const [playerQuery, setPlayerQuery] = useState('')
  const [unitFilter, setUnitFilter] = useState<UnitKey | 'all'>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter | 'all'>('all')
  const { teams: teamsResource, weeks: weeksResource } = useSession()
  const { data: teams } = teamsResource
  const { data: weeks } = weeksResource
  const { status: gamesStatus, data: games, error: gamesError, run: loadGames } = useListGamesForTeam()
  const { status: playersStatus, data: players, error: playersError, run: loadPlayers } = useListPlayersForTeam()
  const { data: results, run: loadResults } = useListResultsForGames()
  const nowMs = useNow()

  useEffect(() => {
    if (!teamId) return
    loadGames({ teamId })
    loadPlayers({ teamId })
  }, [teamId, loadGames, loadPlayers])

  useEffect(() => {
    if (games && games.length > 0) loadResults({ gameIds: games.map((game) => game.id) })
  }, [games, loadResults])

  const teamName = useMemo(() => teams?.find((team) => team.id === teamId)?.name ?? teamId ?? '', [teams, teamId])
  const weekById = useMemo(() => new Map((weeks ?? []).map((week) => [week.id, week])), [weeks])
  const weekLabelFor = (weekId: string) => {
    const week = weekById.get(weekId)
    return week ? weekLabel(week) : ''
  }
  const teamNameById = useMemo(() => new Map((teams ?? []).map((team) => [team.id, team.name])), [teams])
  const gameSections = useMemo(() => groupGamesByWeekType(games ?? [], weekById), [games, weekById])
  const resultsByGame = useMemo(() => new Map((results ?? []).map((result) => [result.gameId, result])), [results])
  const standing = useMemo(() => computeTeamStanding(teamId ?? '', games ?? [], resultsByGame), [teamId, games, resultsByGame])
  const nextGame = useMemo(() => findNextGame(teamId ?? '', games ?? [], new Date(nowMs)), [teamId, games, nowMs])
  const playedGames = standing.wins + standing.losses + standing.ties
  const division = teamId ? getTeamDivision(teamId) : null
  const accent = teamId ? getReadableAccent(teamId) : undefined
  const heroGlow = teamId ? getTeamColors(teamId).primary : undefined
  const filteredPlayers = useMemo(() => filterPlayersByName(players ?? [], playerQuery), [players, playerQuery])
  const presentUnits = useMemo(
    () => UNIT_ORDER.filter((unit) => (players ?? []).some((player) => unitKeyOf(player.unit) === unit)),
    [players],
  )
  const presentAvailabilityFilters = useMemo(
    () =>
      AVAILABILITY_FILTER_ORDER.filter((tone) => (players ?? []).some((player) => getAvailability(player).tone === tone)),
    [players],
  )
  const visiblePlayers = useMemo(() => {
    let result = unitFilter === 'all' ? filteredPlayers : filteredPlayers.filter((player) => unitKeyOf(player.unit) === unitFilter)
    if (availabilityFilter !== 'all') {
      result = result.filter((player) => getAvailability(player).tone === availabilityFilter)
    }
    return result
  }, [filteredPlayers, unitFilter, availabilityFilter])
  const nextGameLabel = useMemo(() => {
    if (!nextGame || !teamId) return null
    const isHome = nextGame.homeTeamId === teamId
    const opponentId = isHome ? nextGame.awayTeamId : nextGame.homeTeamId
    const opponentName = teamNameById.get(opponentId) ?? opponentId
    return `${isHome ? 'Recibe a' : 'Visita a'} ${opponentName} · ${formatKickoff(nextGame.kickoffAt)}`
  }, [nextGame, teamId, teamNameById])

  /** Ventana entre el kickoff y el resultado cargado (ver getGameLiveStatus) — mientras dura, se prioriza sobre el "proximo partido" en vez de saltarselo de largo. */
  const liveGame = useMemo(() => {
    if (!teamId) return null
    const now = new Date(nowMs)
    return (games ?? []).find((game) => getGameLiveStatus(game, resultsByGame.get(game.id) ?? null, now) === 'live') ?? null
  }, [games, resultsByGame, nowMs, teamId])
  const liveGameLabel = useMemo(() => {
    if (!liveGame || !teamId) return null
    const isHome = liveGame.homeTeamId === teamId
    const opponentId = isHome ? liveGame.awayTeamId : liveGame.homeTeamId
    return `${isHome ? 'Recibe a' : 'Visita a'} ${teamNameById.get(opponentId) ?? opponentId}`
  }, [liveGame, teamId, teamNameById])

  if (!teamId) return null

  return (
    <section>
      <Link to="/teams" className={styles.backLink}>
        <Icon name="arrowLeft" size={14} /> Equipos
      </Link>

      <div className={`${styles.hero} glass-surface`} style={{ '--hero-glow': heroGlow } as CSSProperties}>
        <div className={styles.heroTop}>
          <TeamBadge teamId={teamId} size="lg" />
          <div className={styles.heroInfo}>
            <h1 className={styles.heroTitle}>{teamName}</h1>
            <div className={styles.heroMeta}>
              {division && (
                <span className={styles.heroDivision}>
                  {division.conference} {division.division}
                </span>
              )}
              {playedGames > 0 && (
                <span className={styles.heroRecord} style={{ color: accent }}>
                  {standing.wins}-{standing.losses}
                  {standing.ties > 0 ? `-${standing.ties}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        {liveGameLabel ? (
          <div className={`${styles.heroNextGame} ${styles.heroLive}`}>
            <span className={styles.liveDot} aria-hidden="true" />
            En vivo · {liveGameLabel}
          </div>
        ) : (
          nextGameLabel && (
            <div className={styles.heroNextGame}>
              <Icon name="calendar" size={13} />
              {nextGameLabel}
            </div>
          )
        )}
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
          {gamesStatus === 'pending' && <LoadingSpinner variant="inline" label="Cargando calendario" />}
          {gamesError && <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />}
          {games && games.length === 0 && <EmptyState message="Este equipo todavía no tiene partidos cargados." />}
          {gameSections.map(([type, sectionGames]) => (
            <div key={type} className={styles.gameSection}>
              <h3 className={styles.gameSectionTitle}>{SECTION_LABEL[type]}</h3>
              <div className={styles.gameList}>
                {sectionGames.map((game) => {
                  const isHome = game.homeTeamId === teamId
                  const opponentId = isHome ? game.awayTeamId : game.homeTeamId
                  const result = resultsByGame.get(game.id) ?? null
                  const isFinal = getGameLiveStatus(game, result, new Date(nowMs)) === 'final' && result !== null
                  const isTie = isFinal && result!.outcome === 'tie'
                  const isWin = isFinal && ((result!.outcome === 'home' && isHome) || (result!.outcome === 'away' && !isHome))
                  const outcomeClass = !isFinal ? '' : isTie ? styles.gameCardTie : isWin ? styles.gameCardWin : styles.gameCardLoss
                  return (
                    <div key={game.id} className={`${styles.gameCard} glass-surface ${outcomeClass}`}>
                      <TeamBadge teamId={opponentId} size="md" />
                      <div className={styles.gameInfo}>
                        <span className={styles.gameMatchup}>
                          {isHome ? 'Recibe a' : 'Visita a'} {teamNameById.get(opponentId) ?? opponentId}
                        </span>
                        <span className={styles.gameWeek}>
                          {weekLabelFor(game.weekId)} · {isHome ? 'de local' : 'de visitante'}
                        </span>
                      </div>
                      {isFinal ? (
                        <div className={styles.gameResult}>
                          <span className={`${styles.gameOutcome} ${isTie ? styles.outcomeTie : isWin ? styles.outcomeWin : styles.outcomeLoss}`}>
                            {isTie ? 'Empate' : isWin ? 'Ganó' : 'Perdió'}
                          </span>
                          <span className={styles.gameScore}>
                            {isHome ? `${result!.homeScore}-${result!.awayScore}` : `${result!.awayScore}-${result!.homeScore}`}
                          </span>
                        </div>
                      ) : (
                        <span className={styles.gameKickoff}>{formatKickoff(game.kickoffAt)}</span>
                      )}
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
          {playersStatus === 'pending' && <LoadingSpinner variant="inline" label="Cargando plantilla" />}
          {playersError && <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />}
          {players && players.length === 0 && (
            <EmptyState message="Todavía no se ha sincronizado la plantilla de este equipo." />
          )}
          {players && players.length > 0 && (
            <>
              <div className={styles.toolbar}>
                <div className={styles.searchField}>
                  <Icon name="search" size={14} className={styles.searchIcon} />
                  <input
                    type="search"
                    className={styles.playerSearch}
                    placeholder="Buscar jugador..."
                    value={playerQuery}
                    onChange={(event) => setPlayerQuery(event.target.value)}
                    aria-label="Buscar jugador por nombre"
                  />
                </div>
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
              </div>

              <div className={styles.unitChips} role="tablist" aria-label="Filtrar por unidad">
                <button
                  type="button"
                  role="tab"
                  aria-selected={unitFilter === 'all'}
                  className={`${styles.unitChip} ${unitFilter === 'all' ? styles.unitChipActive : ''}`}
                  onClick={() => setUnitFilter('all')}
                >
                  Todos
                </button>
                {presentUnits.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    role="tab"
                    aria-selected={unitFilter === unit}
                    className={`${styles.unitChip} ${unitFilter === unit ? styles.unitChipActive : ''}`}
                    onClick={() => setUnitFilter(unit)}
                  >
                    {UNIT_LABEL[unit]}
                  </button>
                ))}
              </div>

              {presentAvailabilityFilters.length > 0 && (
                <div className={styles.unitChips} role="tablist" aria-label="Filtrar por disponibilidad">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={availabilityFilter === 'all'}
                    className={`${styles.unitChip} ${availabilityFilter === 'all' ? styles.unitChipActive : ''}`}
                    onClick={() => setAvailabilityFilter('all')}
                  >
                    Todos
                  </button>
                  {presentAvailabilityFilters.map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      role="tab"
                      aria-selected={availabilityFilter === tone}
                      className={`${styles.availabilityChip} ${availabilityFilter === tone ? styles.availabilityChipActive : ''}`}
                      style={{ '--chip-tone': AVAILABILITY_FILTER_CSS_VAR[tone] } as CSSProperties}
                      onClick={() => setAvailabilityFilter(tone)}
                    >
                      <span className={styles.availabilityChipDot} />
                      {AVAILABILITY_FILTER_LABEL[tone]}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {players && players.length > 0 && visiblePlayers.length === 0 && (
            <EmptyState message="No se encontraron jugadores." />
          )}
          {visiblePlayers.length > 0 && (
            <div className={styles.playerGrid} key={`${unitFilter}-${playerQuery}`}>
              {visiblePlayers.map((player, index) => (
                <PlayerCard key={player.id} player={player} index={index} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
