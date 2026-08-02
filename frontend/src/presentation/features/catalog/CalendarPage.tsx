import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toPng } from 'html-to-image'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
import { useListAllGames } from '@/presentation/hooks/useListAllGames'
import { useListTeams } from '@/presentation/hooks/useListTeams'
import type { Game, Week, WeekType } from '@/core/entities/catalog'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
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

function formatDayLabel(date: Date): string {
  const raw = date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
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

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function downloadNodeAsImage(node: HTMLElement, fileName: string, excludeClassName?: string) {
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: '#0b0f14',
    filter: excludeClassName ? (child) => !child.classList?.contains(excludeClassName) : undefined,
  })
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  link.click()
}

function MatchChip({ game, teamName }: { game: Game; teamName: (id: string) => string }) {
  return (
    <li className={styles.matchChip} title={`${teamName(game.homeTeamId)} vs ${teamName(game.awayTeamId)}`}>
      <span className={styles.matchChipTeams}>
        <TeamBadge teamId={game.homeTeamId} size="sm" />
        <span className={styles.matchChipSep}>-</span>
        <TeamBadge teamId={game.awayTeamId} size="sm" />
      </span>
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

/** Agrupa por fecha de kickoff para no repetir el dia en cada chip (un domingo de temporada regular puede tener 10+ partidos). */
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

/** Agrupa los partidos de un dia por hora de kickoff, para mostrar la hora una sola vez por franja en vez de repetirla en cada chip. */
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

function WeekCard({ week, games, teamName }: { week: Week; games: Game[]; teamName: (id: string) => string }) {
  const sorted = [...games].sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())
  const dayGroups = groupByDay(sorted)
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!cardRef.current || downloading) return

    setDownloading(true)
    try {
      await downloadNodeAsImage(cardRef.current, `calendario-${slugify(weekLabel(week))}.png`)
    } catch (err) {
      console.error('No se pudo generar la imagen de la semana', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className={styles.weekCardWrap}>
      <Link ref={cardRef} to={`/weeks/${week.id}/games`} className={`${styles.weekCard} glass-surface`}>
        <div className={styles.weekCardHeader}>
          <span className={styles.weekCardLabel}>{weekLabel(week)}</span>
          <span className={styles.weekCardCount}>
            {sorted.length} {sorted.length === 1 ? 'partido' : 'partidos'}
          </span>
        </div>

        {sorted.length === 0 ? (
          <p className={`text-body-sm text-muted ${styles.weekCardEmpty}`}>Sin partidos cargados todavia.</p>
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
                          <MatchChip key={game.id} game={game} teamName={teamName} />
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
    </div>
  )
}

/** Calendario general de toda la temporada (hof/pretemporada/regular/playoffs) de un vistazo, sin ir semana por semana. Partidos como chips compactos en grid (en vez de lista vertical de una fila por partido) para que quepan mas semanas en pantalla sin ocultar informacion detras de un clic. */
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
  const calendarRef = useRef<HTMLDivElement>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)

  const handleDownloadAll = async () => {
    if (!calendarRef.current || downloadingAll) return

    setDownloadingAll(true)
    try {
      await downloadNodeAsImage(calendarRef.current, 'calendario-nfl-temporada.png', styles.weekCardDownload)
    } catch (err) {
      console.error('No se pudo generar la imagen del calendario', err)
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
            {downloadingAll ? 'Generando...' : 'Descargar calendario'}
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

      <div ref={calendarRef}>
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
      </div>
    </section>
  )
}
