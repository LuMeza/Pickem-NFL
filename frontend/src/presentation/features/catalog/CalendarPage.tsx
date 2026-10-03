import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListResultsForGames } from '@/presentation/hooks/useListResultsForGames'
import { useNow } from '@/presentation/hooks/useNow'
import { getGameLiveStatus } from '@/core/rules/getGameLiveStatus'
import { formatLivePeriod } from '@/core/rules/formatLivePeriod'
import { pickDefaultWeek } from '@/core/rules/pickDefaultWeek'
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

/** Mismo margen que pickDefaultWeek/GamesPage: un partido dura ~4h en cancha. */
const LIVE_WINDOW_MS = 4 * 60 * 60 * 1000

const SEGMENT_ORDER: WeekType[] = ['hof', 'pretemporada', 'regular', 'playoffs']

const SEGMENT_LABEL: Record<WeekType, string> = {
  hof: 'Hall of Fame',
  pretemporada: 'Pretemporada',
  regular: 'Temporada regular',
  playoffs: 'Playoffs',
}

const RAIL_SEGMENT_LABEL: Record<WeekType, string> = {
  hof: 'HOF',
  pretemporada: 'Pretemporada',
  regular: 'Temporada regular',
  playoffs: 'Playoffs',
}

const PLAYOFFS_SHORT_LABEL: Record<number, string> = { 1: 'WC', 2: 'DIV', 3: 'CONF', 4: 'SB' }

type WeekStatus = 'past' | 'current' | 'upcoming' | 'empty'

const STATUS_LABEL: Record<WeekStatus, string> = {
  past: 'Jugada',
  current: 'Esta semana',
  upcoming: 'Próxima',
  empty: 'Sin partidos',
}

/** Etiqueta corta para la celda del riel: tiene que caber en ~40px. */
function railLabel(week: Week): string {
  if (week.type === 'hof') return 'HOF'
  if (week.type === 'pretemporada') return `P${week.number}`
  if (week.type === 'playoffs') return PLAYOFFS_SHORT_LABEL[week.number] ?? `R${week.number}`
  return String(week.number)
}

function sortByNumber(weeks: Week[]): Week[] {
  return [...weeks].sort((a, b) => a.number - b.number)
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '')
}

function formatWeekday(date: Date): string {
  return date.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')
}

/** "25 – 29 sep" si cae en un mes, "29 sep – 2 oct" si cruza. */
function formatRange(start: Date, end: Date): string {
  if (start.toDateString() === end.toDateString()) return formatShortDate(start)
  if (start.getMonth() === end.getMonth()) return `${start.getDate()} – ${formatShortDate(end)}`
  return `${formatShortDate(start)} – ${formatShortDate(end)}`
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

/** Agrupa por fecha de kickoff para no repetir el día en cada partido (un domingo de temporada regular puede tener 10+ partidos). */
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

/** Agrupa los partidos de un día por hora de kickoff, para mostrar la hora una sola vez por franja. */
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

function GameTile({
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
  const score =
    (status === 'final' || status === 'live') && result && result.homeScore !== null && result.awayScore !== null
      ? { home: result.homeScore, away: result.awayScore }
      : null
  // null mientras no hay final; 'tie' para que un empate no marque a nadie como perdedor.
  const winner =
    status === 'final' && score
      ? score.home > score.away
        ? 'home'
        : score.away > score.home
          ? 'away'
          : 'tie'
      : null
  const title = score
    ? `${teamName(game.homeTeamId)} ${score.home} - ${score.away} ${teamName(game.awayTeamId)}`
    : `${teamName(game.homeTeamId)} vs ${teamName(game.awayTeamId)}`

  return (
    <li className={`${styles.gameTile} ${status === 'live' ? styles.gameTileLive : ''}`} title={title}>
      <span className={`${styles.gameSide} ${winner === 'away' ? styles.gameSideLost : ''}`}>
        <TeamBadge teamId={game.homeTeamId} size="xs" />
        <span className={styles.gameAbbr}>{game.homeTeamId}</span>
      </span>
      <span className={styles.gameCenter}>
        {score ? (
          // Puntaje del ganador fuerte y el del perdedor apagado; junto con el logo
          // en gris del perdedor basta (en mosaicos tan chicos, flecha y "Final"
          // eran ruido repetido en cada partido).
          <span className={styles.gameScore}>
            <span className={winner === 'away' ? styles.scoreLost : undefined}>{score.home}</span>
            <span className={styles.scoreDash}>&#8211;</span>
            <span className={winner === 'home' ? styles.scoreLost : undefined}>{score.away}</span>
          </span>
        ) : (
          <span className={styles.gameVs}>vs</span>
        )}
        {winner === 'tie' && <span className={styles.gameFinal}>Empate</span>}
        {status === 'live' && (
          <span className={styles.gameLive}>
            <span className={styles.liveDot} aria-hidden="true" />
            {formatLivePeriod(game.livePeriod) ?? 'En vivo'}
          </span>
        )}
      </span>
      <span className={`${styles.gameSide} ${styles.gameSideAway} ${winner === 'home' ? styles.gameSideLost : ''}`}>
        <span className={styles.gameAbbr}>{game.awayTeamId}</span>
        <TeamBadge teamId={game.awayTeamId} size="xs" />
      </span>
    </li>
  )
}

interface WeekInfo {
  week: Week
  games: Game[]
  status: WeekStatus
  start: Date | null
  end: Date | null
}

/**
 * Riel con todas las semanas de la temporada: se ve la temporada completa y
 * en qué punto va (jugada / esta semana / próxima) sin apilar 26 tarjetas
 * que obligaban a deslizar varias pantallas para llegar a la semana actual.
 */
function SeasonRail({
  segments,
  infos,
  selectedId,
  onSelect,
}: {
  segments: WeekType[]
  infos: WeekInfo[]
  selectedId: string | null
  onSelect: (weekId: string) => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  // Centra la celda elegida dentro del riel (solo scroll horizontal del riel, nunca de la página).
  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || !selectedId) return
    const cell = scroller.querySelector<HTMLElement>(`[data-week-id="${selectedId}"]`)
    if (!cell) return
    const target = cell.offsetLeft - scroller.clientWidth / 2 + cell.offsetWidth / 2
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scroller.scrollTo({ left: Math.max(0, target), behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [selectedId])

  return (
    <div className={styles.rail}>
      <div className={styles.railScroller} ref={scrollerRef}>
        {segments.map((type) => {
          const segmentInfos = infos.filter((info) => info.week.type === type)
          return (
            <div key={type} className={styles.railSegment} role="group" aria-label={SEGMENT_LABEL[type]}>
              <span className={styles.railSegmentLabel}>{RAIL_SEGMENT_LABEL[type]}</span>
              <div className={styles.railCells}>
                {segmentInfos.map((info) => {
                  const isSelected = info.week.id === selectedId
                  return (
                    <button
                      key={info.week.id}
                      type="button"
                      data-week-id={info.week.id}
                      className={`${styles.railCell} ${styles[`railCell_${info.status}`] ?? ''} ${
                        isSelected ? styles.railCellSelected : ''
                      }`}
                      aria-pressed={isSelected}
                      aria-label={`${weekLabel(info.week)}, ${STATUS_LABEL[info.status].toLowerCase()}`}
                      onClick={() => onSelect(info.week.id)}
                    >
                      {railLabel(info.week)}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <ul className={styles.railLegend} aria-hidden="true">
        <li>
          <span className={`${styles.legendBar} ${styles.legendPast}`} /> Jugada
        </li>
        <li>
          <span className={`${styles.legendBar} ${styles.legendCurrent}`} /> Esta semana
        </li>
        <li>
          <span className={`${styles.legendBar} ${styles.legendUpcoming}`} /> Próxima
        </li>
      </ul>
    </div>
  )
}

function WeekFocus({
  info,
  prev,
  next,
  onSelect,
  teamName,
  resultsByGame,
  nowMs,
}: {
  info: WeekInfo
  prev: WeekInfo | null
  next: WeekInfo | null
  onSelect: (weekId: string) => void
  teamName: (id: string) => string
  resultsByGame: Map<string, GameResult>
  nowMs: number
}) {
  const { week, games, status, start, end } = info
  const sorted = [...games].sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())
  const dayGroups = groupByDay(sorted)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
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
    <article className={`${styles.focus} glass-surface`} aria-labelledby="calendar-focus-title">
      <header className={styles.focusHeader}>
        <button
          type="button"
          className={styles.stepButton}
          onClick={() => prev && onSelect(prev.week.id)}
          disabled={!prev}
          aria-label={prev ? `Ir a ${weekLabel(prev.week)}` : 'No hay semana anterior'}
        >
          <span aria-hidden="true">◀</span>
        </button>

        <div className={styles.focusTitleBlock}>
          <span className={`${styles.statusPill} ${styles[`statusPill_${status}`] ?? ''}`}>
            {SEGMENT_LABEL[week.type]} · {STATUS_LABEL[status]}
          </span>
          <h2 id="calendar-focus-title" className={styles.focusTitle}>
            {weekLabel(week)}
          </h2>
          <span className={styles.focusMeta}>
            {start && end ? formatRange(start, end) : 'Fechas por definir'}
            {sorted.length > 0 && ` · ${sorted.length} ${sorted.length === 1 ? 'partido' : 'partidos'}`}
          </span>
        </div>

        <button
          type="button"
          className={styles.stepButton}
          onClick={() => next && onSelect(next.week.id)}
          disabled={!next}
          aria-label={next ? `Ir a ${weekLabel(next.week)}` : 'No hay semana siguiente'}
        >
          <span aria-hidden="true">▶</span>
        </button>
      </header>

      <div className={styles.focusActions}>
        <Link to={`/weeks/${week.id}/games`} className={styles.focusLink}>
          Ver detalle de partidos
        </Link>
        {sorted.length > 0 && (
          <button
            type="button"
            className={styles.focusDownload}
            onClick={handleDownload}
            disabled={downloading}
          >
            <Icon name="download" size={14} />
            {downloading ? 'Generando...' : 'Descargar imagen'}
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className={`text-body-sm text-muted ${styles.focusEmpty}`}>Esta semana todavía no tiene partidos cargados.</p>
      ) : (
        <div className={styles.agenda}>
          {dayGroups.map((group) => (
            <section key={group.dateKey} className={styles.agendaDay} aria-label={formatShortDate(group.date)}>
              <div className={styles.agendaDayLabel}>
                <span className={styles.agendaWeekday}>{formatWeekday(group.date)}</span>
                <span className={styles.agendaDate}>{formatShortDate(group.date)}</span>
              </div>
              <div className={styles.agendaSlots}>
                {groupByTime(group.games).map((slot) => (
                  <div key={slot.time} className={styles.agendaSlot}>
                    <span className={styles.agendaTime}>{slot.time}</span>
                    <ul className={styles.gameGrid}>
                      {slot.games.map((game) => (
                        <GameTile
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
            </section>
          ))}
        </div>
      )}
    </article>
  )
}

/** Calendario de la temporada: riel con todas las semanas arriba y, debajo, la semana elegida (por defecto, la actual) en formato agenda. La semana vive en `?semana=` para poder compartir el enlace. */
export function CalendarPage() {
  const { weeks: weeksResource, games: gamesResource, teams: teamsResource } = useSession()
  const { status, data: weeks, error } = weeksResource
  const { data: games } = gamesResource
  const { data: teams } = teamsResource
  const { data: results, run: loadResults } = useListResultsForGames()
  const nowMs = useNow()
  const [searchParams, setSearchParams] = useSearchParams()

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
  const orderedWeeks = segments.flatMap((type) => sortByNumber((weeks ?? []).filter((week) => week.type === type)))
  const currentWeek = weeks && weeks.length > 0 ? pickDefaultWeek(weeks, games ?? [], new Date(nowMs)) : null

  const infos: WeekInfo[] = orderedWeeks.map((week) => {
    const weekGames = gamesByWeek.get(week.id) ?? []
    if (weekGames.length === 0) return { week, games: weekGames, status: 'empty', start: null, end: null }

    const times = weekGames.map((game) => game.kickoffAt.getTime())
    const start = new Date(Math.min(...times))
    const end = new Date(Math.max(...times))
    const weekStatus: WeekStatus =
      week.id === currentWeek?.id ? 'current' : end.getTime() + LIVE_WINDOW_MS < nowMs ? 'past' : 'upcoming'
    return { week, games: weekGames, status: weekStatus, start, end }
  })

  const requestedId = searchParams.get('semana')
  const selectedIndex = Math.max(
    0,
    infos.findIndex((info) => info.week.id === (requestedId ?? currentWeek?.id)),
  )
  const selected = infos[selectedIndex] ?? null

  const selectWeek = (weekId: string) => {
    setSearchParams(
      (params) => {
        params.set('semana', weekId)
        return params
      },
      { replace: true },
    )
  }

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
          <h1 className="text-display-lg">Calendario</h1>
          <p className="text-body-sm text-muted">Elige una semana en la temporada para ver sus partidos.</p>
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

      {selected && (
        <>
          <SeasonRail segments={segments} infos={infos} selectedId={selected.week.id} onSelect={selectWeek} />
          <WeekFocus
            key={selected.week.id}
            info={selected}
            prev={infos[selectedIndex - 1] ?? null}
            next={infos[selectedIndex + 1] ?? null}
            onSelect={selectWeek}
            teamName={teamName}
            resultsByGame={resultsByGame}
            nowMs={nowMs}
          />
        </>
      )}
    </section>
  )
}
