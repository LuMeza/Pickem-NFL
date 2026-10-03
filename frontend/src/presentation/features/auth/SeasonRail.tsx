import type { Week, WeekType } from '@/core/entities/catalog'
import type { ProfileWeeklyTrendPoint } from '@/core/entities/achievement'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import styles from './SeasonRail.module.css'

const PLAYOFFS_SHORT_LABEL: Record<number, string> = { 1: 'WC', 2: 'DIV', 3: 'CONF', 4: 'SB' }

const SEGMENTS: { type: WeekType; label: string }[] = [
  { type: 'pretemporada', label: 'Pretemp.' },
  { type: 'regular', label: 'Temporada regular' },
  { type: 'playoffs', label: 'Playoffs' },
]

function shortLabel(week: Week): string {
  if (week.type === 'playoffs') return PLAYOFFS_SHORT_LABEL[week.number] ?? `R${week.number}`
  if (week.type === 'pretemporada') return `P${week.number}`
  return `${week.number}`
}

/** 0 = jugada sin aciertos ... 4 = 80% o más. Escalones fijos para que el color se lea como nivel, no como dato exacto. */
function level(point: ProfileWeeklyTrendPoint): number {
  const ratio = point.totalCorrect / point.totalPicked
  if (ratio === 0) return 0
  if (ratio < 0.4) return 1
  if (ratio < 0.6) return 2
  if (ratio < 0.8) return 3
  return 4
}

/**
 * La temporada del jugador en una línea, con el mismo lenguaje que el riel
 * del calendario: un cuadro por semana, más intenso entre más aciertos.
 * Las semanas sin resultado quedan punteadas — se lee igual con 1 semana
 * jugada que con 18.
 */
export function SeasonRail({
  weeks,
  points,
  currentWeekId,
}: {
  weeks: Week[]
  points: ProfileWeeklyTrendPoint[]
  currentWeekId: string | null
}) {
  const pointByWeek = new Map(points.map((point) => [`${point.weekType}-${point.weekNumber}`, point]))

  return (
    <div className={styles.rail}>
      <div className={styles.track}>
        {SEGMENTS.map((segment) => {
          const segmentWeeks = weeks
            .filter((week) => week.type === segment.type)
            .sort((a, b) => a.number - b.number)
          if (segmentWeeks.length === 0) return null
          return (
            <div key={segment.type} className={styles.segment} data-type={segment.type}>
              <span className={styles.segmentLabel}>{segment.label}</span>
              <ol className={styles.cells}>
                {segmentWeeks.map((week) => {
                  const point = pointByWeek.get(`${week.type}-${week.number}`)
                  const name = weekLabel(week)
                  const description = point
                    ? `${name}: ${point.totalCorrect} de ${point.totalPicked} aciertos (${Math.round(
                        (point.totalCorrect / point.totalPicked) * 100,
                      )}%)`
                    : `${name}: sin resultados`
                  return (
                    <li
                      key={week.id}
                      className={styles.cell}
                      data-level={point ? level(point) : undefined}
                      data-current={week.id === currentWeekId}
                      title={description}
                      aria-label={description}
                      tabIndex={0}
                    >
                      <span className={styles.swatch} aria-hidden="true" />
                      <span className={styles.weekNumber} aria-hidden="true">
                        {shortLabel(week)}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>
          )
        })}
      </div>
      <div className={styles.legend} aria-hidden="true">
        <span>Menos</span>
        {[0, 1, 2, 3, 4].map((value) => (
          <span key={value} className={styles.legendSwatch} data-level={value} />
        ))}
        <span>Más aciertos</span>
        <span className={`${styles.legendSwatch} ${styles.legendEmpty}`} />
        <span>Sin jugar</span>
      </div>
    </div>
  )
}
