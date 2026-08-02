import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useListTeams } from '@/presentation/hooks/useListTeams'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
import { useListGamesForTeam } from '@/presentation/hooks/useListGamesForTeam'
import { useListPlayersForTeam } from '@/presentation/hooks/useListPlayersForTeam'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { PlayerCard } from '@/presentation/components/PlayerCard/PlayerCard'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { POSITION_LABEL } from './nflPositions'
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
  const filteredPlayers = useMemo(() => filterPlayersByName(players ?? [], playerQuery), [players, playerQuery])
  const presentUnits = useMemo(
    () => UNIT_ORDER.filter((unit) => (players ?? []).some((player) => unitKeyOf(player.unit) === unit)),
    [players],
  )
  const visiblePlayers = useMemo(
    () => (unitFilter === 'all' ? filteredPlayers : filteredPlayers.filter((player) => unitKeyOf(player.unit) === unitFilter)),
    [filteredPlayers, unitFilter],
  )

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
