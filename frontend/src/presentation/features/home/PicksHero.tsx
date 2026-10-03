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
import styles from './HomePage.module.css'

/**
 * Lo primero de Inicio: la acción pendiente de la semana. Misma tira de
 * colores que la hoja de picks, para que se reconozca de un vistazo.
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
    }))
  const picked = views.filter((view) => view.pickedValue !== null).length
  const missing = views.filter((view) => !view.locked && view.pickedValue === null).length
  const deadline = nextDeadline(views, games, nowMs)

  const title = !deadline ? 'Semana cerrada' : missing === 0 ? '¡Al día!' : `Te faltan ${missing} ${missing === 1 ? 'pick' : 'picks'}`
  const detail = deadline
    ? `${picked} de ${views.length} picks · cierra ${formatDeadline(deadline)}`
    : `${picked} de ${views.length} picks`
  const action = deadline && missing > 0 ? 'Hacer mis picks' : 'Ver mis picks'

  return (
    <Link
      to={`/weeks/${week.id}/games`}
      className={`${styles.picksHero} glass-surface glass-interactive`}
      data-pending={deadline !== null && missing > 0}
    >
      <span className={styles.picksHeroKicker}>{weekLabel(week)}</span>
      <div className={styles.picksHeroRow}>
        <div className={styles.picksHeroText}>
          <span className={styles.picksHeroTitle}>{title}</span>
          <span className={styles.picksHeroDetail}>{detail}</span>
        </div>
        <span className={styles.picksHeroAction}>
          {action} <span aria-hidden="true">→</span>
        </span>
      </div>
      <PickSegments views={views} />
    </Link>
  )
}
