import { useState } from 'react'
import { usePrefersReducedMotion } from '@/presentation/hooks/usePrefersReducedMotion'
import styles from './Ticker.module.css'

export interface TickerProps {
  items: string[]
}

/**
 * Tareas 2.7 y 2.8 (sistema-diseno-ui): franja "EN JUEGO" con scroll
 * horizontal continuo, pausable en hover/tap; con prefers-reduced-motion
 * activo se reemplaza por paginacion manual (sin autoscroll).
 */
export function Ticker({ items }: TickerProps) {
  const [paused, setPaused] = useState(false)
  const [page, setPage] = useState(0)
  const prefersReducedMotion = usePrefersReducedMotion()

  if (items.length === 0) return null

  if (prefersReducedMotion) {
    const current = items[page % items.length]
    return (
      <div className={styles.ticker} role="region" aria-label="Informacion del grupo">
        <div className={styles.paginated}>
          <button
            type="button"
            className={styles.pageButton}
            onClick={() => setPage((p) => (p - 1 + items.length) % items.length)}
            aria-label="Anterior"
          >
            ‹
          </button>
          <span className={styles.item}>{current}</span>
          <button
            type="button"
            className={styles.pageButton}
            onClick={() => setPage((p) => (p + 1) % items.length)}
            aria-label="Siguiente"
          >
            ›
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={styles.ticker}
      role="region"
      aria-label="Informacion del grupo"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused((p) => !p)}
    >
      <div className={styles.track} data-paused={paused}>
        {[...items, ...items].map((item, index) => (
          <span className={styles.item} key={index}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
