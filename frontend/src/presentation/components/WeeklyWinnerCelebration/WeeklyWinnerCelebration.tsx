import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useCanViewPickemTables } from '@/presentation/hooks/useCanViewPickemTables'
import { useListResultsForGames } from '@/presentation/hooks/useListResultsForGames'
import { useListWeeklyStandings } from '@/presentation/hooks/useListWeeklyStandings'
import { Icon } from '@/presentation/components/Icon/Icon'
import { findWeeklyCelebrationWeek } from '@/core/rules/findWeeklyCelebrationWeek'
import { resolveWeeklyWinner } from '@/core/rules/resolveWeeklyWinner'
import type { Week } from '@/core/entities/catalog'
import styles from './WeeklyWinnerCelebration.module.css'

const PIECE_COUNT = 40
const PIECE_COLORS = ['var(--accent-blue)', 'var(--accent-red)', 'var(--accent-silver)', '#ffffff']

/** Piezas fijas (sin azar) para que el render sea estable: posición, retraso, duración y giro salen del índice. */
const PIECES = Array.from({ length: PIECE_COUNT }, (_, index) => {
  const size = 6 + (index % 3) * 3
  return {
    key: index,
    style: {
      left: `${(index * 37 + 11) % 100}%`,
      width: size,
      height: index % 4 === 0 ? size : size * 2,
      background: PIECE_COLORS[index % PIECE_COLORS.length],
      borderRadius: index % 5 === 0 ? '50%' : 2,
      animationDelay: `${((index * 53) % 20) / 10}s`,
      animationDuration: `${2.8 + ((index * 17) % 15) / 10}s`,
      '--dx': `${((index * 29) % 120) - 60}px`,
      '--rot': `${360 + ((index * 71) % 5) * 180}deg`,
    } as CSSProperties,
  }
})

function seenKey(userId: string, weekId: string): string {
  return `pickem-celebrated:${userId}:${weekId}`
}

function hasSeen(userId: string, weekId: string): boolean {
  try {
    return localStorage.getItem(seenKey(userId, weekId)) === '1'
  } catch {
    return false
  }
}

function markSeen(userId: string, weekId: string): void {
  try {
    localStorage.setItem(seenKey(userId, weekId), '1')
  } catch {
    // Sin almacenamiento solo se repetiría la celebración: no es grave.
  }
}

interface CelebrationViewProps {
  weekLabel: string
  correctCount: number
  coWinnerNames: string[]
  tableTo: string
  onClose: () => void
}

function CelebrationView({ weekLabel, correctCount, coWinnerNames, tableTo, onClose }: CelebrationViewProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="winner-title">
      <div className={styles.confetti} aria-hidden="true">
        {PIECES.map((piece) => (
          <span key={piece.key} className={styles.piece} style={piece.style} />
        ))}
      </div>

      <div className={styles.card}>
        <span className={styles.medal}>
          <Icon name="trophy" size={44} />
        </span>
        <p className={styles.weekLabel}>{weekLabel}</p>
        <h2 id="winner-title" className={styles.title}>
          Primer lugar
        </h2>
        <p className={styles.score}>
          <strong>{correctCount}</strong> {correctCount === 1 ? 'acierto' : 'aciertos'}
        </p>

        {coWinnerNames.length > 0 && (
          <div className={styles.shared}>
            <span className={styles.sharedLabel}>Compartes el primer lugar con</span>
            <ul className={styles.sharedList}>
              {coWinnerNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.actions}>
          <Link to={tableTo} className={styles.primaryLink} onClick={onClose}>
            Ver la tabla completa
          </Link>
          <button ref={closeRef} type="button" className="button-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export interface WeeklyWinnerCelebrationProps {
  formatWeekLabel: (week: Week) => string
}

/**
 * Pantalla de celebración con confeti para quien termina en el primer lugar
 * (solo o empatado) de la semana que acaba de cerrar. Se muestra una sola vez
 * por semana y por usuario, y solo cuando todos los resultados ya están
 * cargados y el usuario puede ver las tablas.
 */
export function WeeklyWinnerCelebration({ formatWeekLabel }: WeeklyWinnerCelebrationProps) {
  const { profile, group, weeks, games } = useSession()
  const { data: canView, run: loadCanView } = useCanViewPickemTables()
  const { data: results, run: loadResults } = useListResultsForGames()
  const { data: standings, run: loadStandings } = useListWeeklyStandings()
  const [dismissed, setDismissed] = useState(false)

  const userId = profile.data?.userId ?? null
  const groupId = group.data?.id ?? null

  const week = useMemo(
    () => (weeks.data && games.data ? findWeeklyCelebrationWeek(weeks.data, games.data, new Date()) : null),
    [weeks.data, games.data],
  )
  const weekGames = useMemo(
    () => (week && games.data ? games.data.filter((game) => game.weekId === week.id) : []),
    [week, games.data],
  )

  const alreadySeen = week && userId ? hasSeen(userId, week.id) : true
  const weekId = week?.id ?? null
  const gameIds = useMemo(() => weekGames.map((game) => game.id), [weekGames])

  useEffect(() => {
    if (!weekId || !groupId || !userId || alreadySeen) return
    loadCanView({ groupId }).catch(() => undefined)
    loadResults({ gameIds }).catch(() => undefined)
    loadStandings({ groupId, weekId }).catch(() => undefined)
  }, [weekId, groupId, userId, alreadySeen, gameIds, loadCanView, loadResults, loadStandings])

  const allResultsIn =
    results != null &&
    weekGames.length > 0 &&
    weekGames.every((game) =>
      results.some((result) => result.gameId === game.id && result.homeScore !== null && result.awayScore !== null),
    )

  const winner = canView && allResultsIn && standings && userId ? resolveWeeklyWinner(standings, userId) : null
  const open = winner != null && week != null && !dismissed && !alreadySeen

  useEffect(() => {
    if (!open || !week || !userId) return
    markSeen(userId, week.id)
  }, [open, week, userId])

  // Vista previa solo en desarrollo: abrir cualquier pantalla con ?celebracion en la URL.
  const preview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('celebracion')
  if (preview && !dismissed) {
    return (
      <CelebrationView
        weekLabel="Semana 10"
        correctCount={11}
        coWinnerNames={['Juan López', 'Charlie López']}
        tableTo="/pickem/tabla"
        onClose={() => setDismissed(true)}
      />
    )
  }

  if (!open || !winner || !week) return null

  return (
    <CelebrationView
      weekLabel={formatWeekLabel(week)}
      correctCount={winner.correctCount}
      coWinnerNames={winner.coWinners.map((row) => row.displayName)}
      tableTo={`/pickem/tabla/${week.id}`}
      onClose={() => setDismissed(true)}
    />
  )
}
