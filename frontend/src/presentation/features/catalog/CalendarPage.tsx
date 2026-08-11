import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListResultsForGames } from '@/presentation/hooks/useListResultsForGames'
import { useNow } from '@/presentation/hooks/useNow'
import { getGameLiveStatus } from '@/core/rules/getGameLiveStatus'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import type { Game, Week, WeekType } from '@/core/entities/catalog'
import type { GameResult } from '@/core/entities/gameResult'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { ExportPage, ExportWeekBlock } from './calendarExport/ExportLayouts'
import { downloadElementAsPng, downloadPagesAsPdf, type PdfPageSpec } from './calendarExport/exportCapture'
import styles from './CalendarPage.module.css'

/** Ancho fijo de captura: espacioso para una sola semana por pagina (Regular, HOF, y el PNG individual), mas angosto no hace falta porque cada pagina define su propio alto segun el contenido. */
const EXPORT_WEEK_WIDTH = 900
/** Paginas que apilan varias semanas (Pretemporada, Playoffs) piden un poco mas de aire horizontal. */
const EXPORT_SEGMENT_WIDTH = 1000

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

function formatDayLabel(date: Date): string {
  const raw = date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function segmentAnchor(type: WeekType): string {
  return `segmento-${type}`
}

function sortByNumber(weeks: Week[]): Week[] {
  return [...weeks].sort((a, b) => a.number - b.number)
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function MatchChip({
  game,
  teamName,
  result,
  nowMs,
}: {
  game: Game
  teamName: (id: string) => string
  result: GameResult | null
  nowMs: number
}) {
  const status = getGameLiveStatus(game, result, new Date(nowMs))
  const title =
    status === 'final' && result
      ? `${teamName(game.homeTeamId)} ${result.homeScore} - ${result.awayScore} ${teamName(game.awayTeamId)}`
      : `${teamName(game.homeTeamId)} vs ${teamName(game.awayTeamId)}`

  return (
    <li className={`${styles.matchChip} ${status === 'live' ? styles.matchChipLive : ''}`} title={title}>
      <span className={styles.matchChipTeams}>
        <TeamBadge teamId={game.homeTeamId} size="sm" />
        {status === 'final' && result ? (
          <span className={styles.matchChipScore}>
            {result.homeScore}&#8211;{result.awayScore}
          </span>
        ) : (
          <span className={styles.matchChipSep}>-</span>
        )}
        <TeamBadge teamId={game.awayTeamId} size="sm" />
      </span>
      {status === 'live' && (
        <span className={styles.matchChipStatus}>
          <span className={styles.liveDot} aria-hidden="true" />
          En vivo
        </span>
      )}
    </li>
  )
}

interface DayGroup {
  dateKey: string
  date: Date
  games: Game[]
}

interface TimeGroup {
  time: string
  games: Game[]
}

/** Agrupa por fecha de kickoff para no repetir el día en cada chip (un domingo de temporada regular puede tener 10+ partidos). */
function groupByDay(sortedGames: Game[]): DayGroup[] {
  const groupByDate = new Map<string, DayGroup>()

  for (const game of sortedGames) {
    const dateKey = game.kickoffAt.toDateString()
    const existing = groupByDate.get(dateKey)
    if (existing) {
      existing.games.push(game)
    } else {
      groupByDate.set(dateKey, { dateKey, date: game.kickoffAt, games: [game] })
    }
  }

  return [...groupByDate.values()]
}

/** Agrupa los partidos de un día por hora de kickoff, para mostrar la hora una sola vez por franja en vez de repetirla en cada chip. */
function groupByTime(dayGames: Game[]): TimeGroup[] {
  const groupByClock = new Map<string, TimeGroup>()

  for (const game of dayGames) {
    const time = game.kickoffAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    const existing = groupByClock.get(time)
    if (existing) {
      existing.games.push(game)
    } else {
      groupByClock.set(time, { time, games: [game] })
    }
  }

  return [...groupByClock.values()]
}

function WeekCard({
  week,
  games,
  teamName,
  resultsByGame,
  nowMs,
}: {
  week: Week
  games: Game[]
  teamName: (id: string) => string
  resultsByGame: Map<string, GameResult>
  nowMs: number
}) {
  const sorted = [...games].sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())
  const dayGroups = groupByDay(sorted)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (downloading || sorted.length === 0) return

    setDownloading(true)
    try {
      await downloadElementAsPng(
        <ExportPage title={weekLabel(week)} subtitle={SEGMENT_LABEL[week.type]} widthPx={EXPORT_WEEK_WIDTH}>
          <ExportWeekBlock week={week} games={sorted} results={resultsByGame} teamName={teamName} density="spacious" />
        </ExportPage>,
        EXPORT_WEEK_WIDTH,
        `calendario-${slugify(weekLabel(week))}.png`,
      )
    } catch (err) {
      console.error('No se pudo generar la imagen de la semana', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className={styles.weekCardWrap}>
      <Link to={`/weeks/${week.id}/games`} className={`${styles.weekCard} glass-surface`}>
        <div className={styles.weekCardHeader}>
          <span className={styles.weekCardLabel}>{weekLabel(week)}</span>
          <span className={styles.weekCardCount}>
            {sorted.length} {sorted.length === 1 ? 'partido' : 'partidos'}
          </span>
        </div>

        {sorted.length === 0 ? (
          <p className={`text-body-sm text-muted ${styles.weekCardEmpty}`}>Sin partidos cargados todavía.</p>
        ) : (
          <div className={styles.dayGroups}>
            {dayGroups.map((group) => (
              <div key={group.dateKey} className={styles.dayGroup}>
                <span className={styles.dayLabel}>{formatDayLabel(group.date)}</span>
                <div className={styles.timeGroups}>
                  {groupByTime(group.games).map((timeGroup) => (
                    <div key={timeGroup.time} className={styles.timeGroup}>
                      <span className={styles.timeLabel}>Hora {timeGroup.time}</span>
                      <ul className={styles.matchGrid}>
                        {timeGroup.games.map((game) => (
                          <MatchChip
                            key={game.id}
                            game={game}
                            teamName={teamName}
                            result={resultsByGame.get(game.id) ?? null}
                            nowMs={nowMs}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Link>

      {sorted.length > 0 && (
        <button
          type="button"
          className={styles.weekCardDownload}
          onClick={handleDownload}
          disabled={downloading}
          aria-label={`Descargar ${weekLabel(week)} como imagen`}
          title="Descargar como imagen"
        >
          <Icon name="download" size={14} />
        </button>
      )}
    </div>
  )
}

/** Calendario general de toda la temporada (hof/pretemporada/regular/playoffs) de un vistazo, sin ir semana por semana. Partidos como chips compactos en grid (en vez de lista vertical de una fila por partido) para que quepan más semanas en pantalla sin ocultar información detrás de un clic. */
export function CalendarPage() {
  const { weeks: weeksResource, games: gamesResource, teams: teamsResource } = useSession()
  const { status, data: weeks, error } = weeksResource
  const { data: games } = gamesResource
  const { data: teams } = teamsResource
  const { data: results, run: loadResults } = useListResultsForGames()
  const nowMs = useNow()

  useEffect(() => {
    if (games && games.length > 0) loadResults({ gameIds: games.map((game) => game.id) })
  }, [games, loadResults])

  const teamNames = new Map((teams ?? []).map((team) => [team.id, team.name]))
  const teamName = (id: string) => teamNames.get(id) ?? id
  const resultsByGame = new Map((results ?? []).map((result) => [result.gameId, result]))

  const gamesByWeek = new Map<string, Game[]>()
  for (const game of games ?? []) {
    const bucket = gamesByWeek.get(game.weekId)
    if (bucket) bucket.push(game)
    else gamesByWeek.set(game.weekId, [game])
  }

  const segments = SEGMENT_ORDER.filter((type) => weeks?.some((week) => week.type === type))
  const [downloadingAll, setDownloadingAll] = useState(false)

  /**
   * Arma una pagina de PDF por segmento, salvo Temporada Regular: con 18
   * semanas y ~15 partidos cada una, meterlas todas en una sola pagina no se
   * leeria — ahi cada semana se vuelve su propia pagina (decision de
   * producto, ver conversacion). Los segmentos sin partidos cargados
   * (playoffs antes de que se sorteen, por ejemplo) se omiten.
   */
  const handleDownloadAll = async () => {
    if (downloadingAll) return

    setDownloadingAll(true)
    try {
      const pages: PdfPageSpec[] = []

      for (const type of segments) {
        const segmentWeeks = sortByNumber((weeks ?? []).filter((week) => week.type === type))
        const weeksWithGames = segmentWeeks
          .map((week) => ({ week, games: gamesByWeek.get(week.id) ?? [] }))
          .filter((entry) => entry.games.length > 0)
        if (weeksWithGames.length === 0) continue

        if (type === 'regular') {
          for (const { week, games: weekGames } of weeksWithGames) {
            pages.push({
              widthPx: EXPORT_WEEK_WIDTH,
              node: (
                <ExportPage
                  key={week.id}
                  title={weekLabel(week)}
                  subtitle={SEGMENT_LABEL[type]}
                  widthPx={EXPORT_WEEK_WIDTH}
                >
                  <ExportWeekBlock week={week} games={weekGames} results={resultsByGame} teamName={teamName} density="spacious" />
                </ExportPage>
              ),
            })
          }
          continue
        }

        const totalGames = weeksWithGames.reduce((sum, entry) => sum + entry.games.length, 0)
        pages.push({
          widthPx: EXPORT_SEGMENT_WIDTH,
          node: (
            <ExportPage
              key={type}
              title={SEGMENT_LABEL[type]}
              subtitle={`${totalGames} ${totalGames === 1 ? 'partido' : 'partidos'}`}
              widthPx={EXPORT_SEGMENT_WIDTH}
            >
              {weeksWithGames.map(({ week, games: weekGames }) => (
                <ExportWeekBlock
                  key={week.id}
                  week={week}
                  games={weekGames}
                  results={resultsByGame}
                  teamName={teamName}
                  density={weeksWithGames.length > 1 ? 'compact' : 'spacious'}
                />
              ))}
            </ExportPage>
          ),
        })
      }

      if (pages.length === 0) return
      await downloadPagesAsPdf(pages, 'calendario-nfl-temporada.pdf')
    } catch (err) {
      console.error('No se pudo generar el PDF del calendario', err)
    } finally {
      setDownloadingAll(false)
    }
  }

  return (
    <section>
      <div className={styles.pageHeader}>
        <div>
          <span className="kicker">
            <Icon name="calendar" size={13} /> Temporada completa
          </span>
          <h1 className="text-display-lg">Calendario</h1>
          <p className="text-body-sm text-muted">Todos los partidos de la temporada, de un vistazo.</p>
        </div>

        {segments.length > 0 && (
          <button
            type="button"
            className={`button-secondary ${styles.downloadAllButton}`}
            onClick={handleDownloadAll}
            disabled={downloadingAll}
          >
            <Icon name="download" size={16} />
            {downloadingAll ? 'Generando PDF...' : 'Descargar PDF'}
          </button>
        )}
      </div>

      {status === 'pending' && <LoadingSpinner variant="inline" label="Cargando calendario" />}
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
              <WeekCard
                key={week.id}
                week={week}
                games={gamesByWeek.get(week.id) ?? []}
                teamName={teamName}
                resultsByGame={resultsByGame}
                nowMs={nowMs}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
