import type { ReactNode } from 'react'
import type { Game, Week } from '@/core/entities/catalog'
import type { GameResult } from '@/core/entities/gameResult'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import { getTeamLogoUrl } from '@/presentation/components/TeamBadge/teamLogos'
import { Logo } from '@/presentation/components/Logo/Logo'
import styles from './ExportLayouts.module.css'

/** Densidad de fila: "spacious" para una sola semana por página (Regular, HOF), "compact" para varias semanas apiladas en una misma página (Pretemporada, Playoffs). */
export type ExportDensity = 'spacious' | 'compact'

/**
 * Insignia de equipo standalone para exportación: sin `loading="lazy"` (el
 * contenedor de captura vive fuera del viewport visible y un observer de
 * intersección nunca dispararía la carga) y sin el fallback a bloque de
 * color de TeamBadge (aquí basta un fondo simple si la imagen no carga).
 */
function ExportBadge({ teamId, size }: { teamId: string; size: number }) {
  return (
    <span className={styles.badge} style={{ width: size, height: size }}>
      <img src={getTeamLogoUrl(teamId)} alt="" className={styles.badgeImg} />
    </span>
  )
}

function ExportMatchRow({
  game,
  result,
  teamName,
  density,
}: {
  game: Game
  result: GameResult | null
  teamName: (id: string) => string
  density: ExportDensity
}) {
  const time = game.kickoffAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const isFinal = result != null && result.homeScore !== null && result.awayScore !== null
  const badgeSize = density === 'spacious' ? 38 : 24

  return (
    <div className={`${styles.row} ${density === 'compact' ? styles.rowCompact : ''}`}>
      <span className={styles.rowTime}>{time}</span>
      <span className={styles.rowTeam}>
        <ExportBadge teamId={game.awayTeamId} size={badgeSize} />
        <span className={styles.rowTeamName}>{teamName(game.awayTeamId)}</span>
      </span>
      <span className={`${styles.rowScore} ${isFinal ? styles.rowScoreFinal : ''}`}>
        {isFinal ? `${result!.awayScore}–${result!.homeScore}` : '@'}
      </span>
      <span className={styles.rowTeam}>
        <ExportBadge teamId={game.homeTeamId} size={badgeSize} />
        <span className={styles.rowTeamName}>{teamName(game.homeTeamId)}</span>
      </span>
    </div>
  )
}

interface DayBucket {
  dateKey: string
  date: Date
  games: Game[]
}

function groupByDate(games: Game[]): DayBucket[] {
  const byDate = new Map<string, DayBucket>()
  for (const game of games) {
    const dateKey = game.kickoffAt.toDateString()
    const existing = byDate.get(dateKey)
    if (existing) existing.games.push(game)
    else byDate.set(dateKey, { dateKey, date: game.kickoffAt, games: [game] })
  }
  return [...byDate.values()].sort((a, b) => a.date.getTime() - b.date.getTime())
}

function formatDayHeading(date: Date): string {
  const raw = date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function ExportWeekBlock({
  week,
  games,
  results,
  teamName,
  density,
}: {
  week: Week
  games: Game[]
  results: Map<string, GameResult>
  teamName: (id: string) => string
  density: ExportDensity
}) {
  const sorted = [...games].sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())
  const dayGroups = groupByDate(sorted)

  return (
    <section className={styles.weekBlock}>
      <h3 className={`${styles.weekBlockTitle} ${density === 'compact' ? styles.weekBlockTitleCompact : ''}`}>
        {weekLabel(week)}
      </h3>
      {dayGroups.map((group) => (
        <div key={group.dateKey} className={styles.dayGroup}>
          <span className={styles.dayHeading}>{formatDayHeading(group.date)}</span>
          <div className={styles.rows}>
            {group.games.map((game) => (
              <ExportMatchRow
                key={game.id}
                game={game}
                result={results.get(game.id) ?? null}
                teamName={teamName}
                density={density}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

export function ExportPage({
  title,
  subtitle,
  widthPx,
  children,
}: {
  title: string
  subtitle?: string
  widthPx: number
  children: ReactNode
}) {
  const generatedOn = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className={styles.page} style={{ width: widthPx }}>
      <div className={styles.topBar} />
      <div className={styles.pageHeader}>
        <span className={styles.brand}>
          <Logo size={22} />
          Pick&apos;em NFL
        </span>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>
      <div className={styles.pageBody}>{children}</div>
      <div className={styles.pageFooter}>Generado el {generatedOn}</div>
    </div>
  )
}
