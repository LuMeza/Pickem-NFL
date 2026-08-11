import type { ProfileWeeklyTrendPoint } from '@/core/entities/achievement'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import styles from './WeeklyTrendChart.module.css'

const PLAYOFFS_SHORT_LABEL: Record<number, string> = {
  1: 'WC',
  2: 'DIV',
  3: 'CONF',
  4: 'SB',
}

function shortWeekLabel(point: ProfileWeeklyTrendPoint): string {
  if (point.weekType === 'playoffs') return PLAYOFFS_SHORT_LABEL[point.weekNumber] ?? `R${point.weekNumber}`
  if (point.weekType === 'pretemporada') return `P${point.weekNumber}`
  return `${point.weekNumber}`
}

export interface WeeklyTrendChartProps {
  points: ProfileWeeklyTrendPoint[]
}

/** Barras finas con la efectividad de las ultimas semanas del usuario en el Pickem Semanal. */
export function WeeklyTrendChart({ points }: WeeklyTrendChartProps) {
  const lastIndex = points.length - 1

  return (
    <div className={styles.chart}>
      {points.map((point, index) => {
        const accuracy = Math.round((point.totalCorrect / point.totalPicked) * 100)
        const isCurrent = index === lastIndex
        const label = weekLabel({ type: point.weekType, number: point.weekNumber })
        return (
          <div key={point.weekSortOrder} className={styles.column} tabIndex={0}>
            <span className={styles.value} aria-hidden="true">
              {isCurrent ? `${accuracy}%` : ''}
            </span>
            <span
              className={`${styles.bar} ${isCurrent ? styles.barCurrent : ''}`}
              style={{ height: `${Math.max(accuracy, 4)}%` }}
            />
            <span className={styles.label}>{shortWeekLabel(point)}</span>
            <span className={styles.tooltip} role="tooltip">
              {label}: {point.totalCorrect}/{point.totalPicked} aciertos ({accuracy}%)
            </span>
          </div>
        )
      })}
    </div>
  )
}
