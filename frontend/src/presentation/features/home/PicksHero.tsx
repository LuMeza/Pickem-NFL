import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Game, Week } from '@/core/entities/catalog'
import type { WeeklyPickValue } from '@/core/ports/WeeklyPickRepository'
import { isWeeklyPickLocked } from '@/core/rules/weeklyPickGroupDeadline'
import type { GamePickView } from '@/presentation/features/catalog/pickSheet/PickRow'
import {
  PickSegments,
  formatDeadline,
  nextDeadline,
} from '@/presentation/features/catalog/pickSheet/PickProgress'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import { useCountdown } from '@/presentation/hooks/useCountdown'
import styles from './HomePage.module.css'

const URGENT_THRESHOLD_MS = 2 * 60 * 60 * 1000

/**
 * Lo primero de Inicio y lo único con peso visual: la acción pendiente de la
 * semana. El reloj al próximo cierre vive aquí (además del header) porque es
 * lo que decide si hay que actuar ya. Misma tira de colores que la hoja de
 * picks, más alta, para que se reconozca de un vistazo.
 */
export function PicksHero({
  week,
  games,
  picks,
  nowMs,
}: {
  week: Week
  games: Game[]
  picks: Record<string, WeeklyPickValue>
  nowMs: number
}) {
  const now = new Date(nowMs)
  const views: GamePickView[] = [...games]
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())
    .map((game) => ({
      game,
      pickedValue: picks[game.id] ?? null,
      result: null,
      isFinal: false,
      isLive: false,
      locked: isWeeklyPickLocked(games, game, now),
      correct: null,
      prediction: null,
    }))
  const picked = views.filter((view) => view.pickedValue !== null).length
  const missing = views.filter((view) => !view.locked && view.pickedValue === null).length
  const deadlineMs = nextDeadline(views, games, nowMs)?.getTime() ?? null
  // Fecha estable por valor: useCountdown reinicia su intervalo si cambia la referencia.
  const deadline = useMemo(() => (deadlineMs === null ? null : new Date(deadlineMs)), [deadlineMs])
  const countdown = useCountdown(deadline)
  const pending = deadline !== null && missing > 0
  const urgent = deadlineMs !== null && deadlineMs - nowMs < URGENT_THRESHOLD_MS

  const title = !deadline ? 'Semana cerrada' : missing === 0 ? '¡Al día!' : `Te faltan ${missing} ${missing === 1 ? 'pick' : 'picks'}`
  const action = pending ? 'Hacer mis picks' : 'Ver mis picks'

  return (
    <Link to={`/weeks/${week.id}/games`} className={`${styles.picksHero} glass-surface`} data-pending={pending}>
      <span className={styles.picksHeroWeek}>{weekLabel(week)}</span>
      <div className={styles.picksHeroRow}>
        <span className={styles.picksHeroTitle}>{title}</span>
        {deadline && countdown && (
          <span className={styles.picksHeroClock} data-urgent={urgent}>
            <span className={styles.picksHeroClockLabel}>Próximo cierre</span>
            <span className={styles.picksHeroClockValue}>{countdown}</span>
          </span>
        )}
      </div>
      <PickSegments views={views} size="lg" />
      <div className={styles.picksHeroFooter}>
        <span className={styles.picksHeroDetail}>
          {picked} de {views.length} picks listos
          {deadline && (
            <>
              <br />
              Cierra {formatDeadline(deadline)}
            </>
          )}
        </span>
        <span className={styles.picksHeroAction}>{action}</span>
      </div>
    </Link>
  )
}
