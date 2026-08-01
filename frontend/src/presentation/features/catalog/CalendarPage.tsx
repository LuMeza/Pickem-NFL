import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
import { useListAllGames } from '@/presentation/hooks/useListAllGames'
import { useListTeams } from '@/presentation/hooks/useListTeams'
import type { Game, Week, WeekType } from '@/core/entities/catalog'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './CalendarPage.module.css'

const SEGMENT_ORDER: WeekType[] = ['hof', 'pretemporada', 'regular', 'playoffs']

const SEGMENT_LABEL: Record<WeekType, string> = {
  hof: 'Hall of Fame',
  pretemporada: 'Pretemporada',
  regular: 'Temporada regular',
  playoffs: 'Playoffs',
}

const SEGMENT_ACCENT: Record<WeekType, string> = {
  hof: styles.dotGold ?? '',
  pretemporada: styles.dotMuted ?? '',
  regular: styles.dotLime ?? '',
  playoffs: styles.dotGold ?? '',
}

const PLAYOFFS_ROUND_LABEL: Record<number, string> = {
  1: 'Wild Card',
  2: 'Divisional',
  3: 'Conference',
  4: 'Super Bowl',
}

function weekLabel(week: Week): string {
  if (week.type === 'playoffs') return PLAYOFFS_ROUND_LABEL[week.number] ?? `Ronda ${week.number}`
  if (week.type === 'hof') return 'Hall of Fame'
  if (week.type === 'pretemporada') return `Pre ${week.number}`
  return `Semana ${week.number}`
}

function segmentAnchor(type: WeekType): string {
  return `segmento-${type}`
}

function sortByNumber(weeks: Week[]): Week[] {
  return [...weeks].sort((a, b) => a.number - b.number)
}

function WeekCard({ week, games, teamName }: { week: Week; games: Game[]; teamName: (id: string) => string }) {
  const sorted = [...games].sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())

  return (
    <Link to={`/weeks/${week.id}/games`} className={`${styles.weekCard} glass-surface`}>
      <div className={styles.weekCardHeader}>
        <span className={styles.weekCardLabel}>{weekLabel(week)}</span>
        <span className={styles.weekCardCount}>
          {sorted.length} {sorted.length === 1 ? 'partido' : 'partidos'}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className={`text-body-sm text-muted ${styles.weekCardEmpty}`}>Sin partidos cargados todavia.</p>
      ) : (
        <ul className={styles.matchList}>
          {sorted.map((game) => (
            <li key={game.id} className={styles.matchRow}>
              <span className={styles.matchTeams}>
                <span className={styles.matchSide}>
                  <TeamBadge teamId={game.homeTeamId} size="sm" />
                  <span className={styles.matchTeamCode} title={teamName(game.homeTeamId)}>
                    {game.homeTeamId}
                  </span>
                </span>
                <span className={styles.matchVs}>vs</span>
                <span className={`${styles.matchSide} ${styles.matchSideAway}`}>
                  <span className={styles.matchTeamCode} title={teamName(game.awayTeamId)}>
                    {game.awayTeamId}
                  </span>
                  <TeamBadge teamId={game.awayTeamId} size="sm" />
                </span>
              </span>
              <span className={styles.matchTime}>
                <span className={styles.matchDate}>
                  {game.kickoffAt.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </span>
                {game.kickoffAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  )
}

/** Calendario general de toda la temporada (hof/pretemporada/regular/playoffs) de un vistazo, sin ir semana por semana. */
export function CalendarPage() {
  const { status, data: weeks, error, run: loadWeeks } = useListWeeks()
  const { data: games, run: loadGames } = useListAllGames()
  const { data: teams, run: loadTeams } = useListTeams()

  useEffect(() => {
    loadWeeks()
    loadGames()
    loadTeams()
  }, [loadWeeks, loadGames, loadTeams])

  const teamNames = new Map((teams ?? []).map((team) => [team.id, team.name]))
  const teamName = (id: string) => teamNames.get(id) ?? id

  const gamesByWeek = new Map<string, Game[]>()
  for (const game of games ?? []) {
    const bucket = gamesByWeek.get(game.weekId)
    if (bucket) bucket.push(game)
    else gamesByWeek.set(game.weekId, [game])
  }

  const segments = SEGMENT_ORDER.filter((type) => weeks?.some((week) => week.type === type))

  return (
    <section>
      <span className="kicker">
        <Icon name="calendar" size={13} /> Temporada completa
      </span>
      <h1 className="text-display-lg">Calendario</h1>
      <p className="text-body-sm text-muted">Todos los partidos de la temporada, de un vistazo.</p>

      {status === 'pending' && <p>Cargando calendario...</p>}
      {error && <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />}
      {weeks && weeks.length === 0 && <EmptyState message={EMPTY_STATE_COPY.noWeeksAvailable} />}

      {segments.length > 1 && (
        <div className={styles.jumpNavWrap}>
          <nav className={styles.jumpNav} aria-label="Saltar a segmento de temporada">
            {segments.map((type) => (
              <a key={type} href={`#${segmentAnchor(type)}`} className={styles.jumpChip}>
                <span className={`${styles.dot} ${SEGMENT_ACCENT[type]}`} aria-hidden="true" />
                {SEGMENT_LABEL[type]}
              </a>
            ))}
          </nav>
        </div>
      )}

      {segments.map((type) => (
        <div key={type} id={segmentAnchor(type)} className={styles.segment}>
          <h2 className={`text-display-sm ${styles.segmentTitle}`}>
            <span className={`${styles.dot} ${SEGMENT_ACCENT[type]}`} aria-hidden="true" />
            {SEGMENT_LABEL[type]}
          </h2>
          <div className={styles.weekGrid}>
            {sortByNumber((weeks ?? []).filter((week) => week.type === type)).map((week) => (
              <WeekCard key={week.id} week={week} games={gamesByWeek.get(week.id) ?? []} teamName={teamName} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
