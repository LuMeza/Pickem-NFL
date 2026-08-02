import { useId } from 'react'
import styles from './LoadingSpinner.module.css'

export type LoadingSpinnerVariant = 'page' | 'inline'

export interface LoadingSpinnerProps {
  /** 'page' centra el spinner en un bloque de altura completa; 'inline' lo ajusta al flujo de una seccion. */
  variant?: LoadingSpinnerVariant
  /** Solo alimenta el aria-label para lectores de pantalla — no se renderiza texto visible. */
  label?: string
}

/**
 * Animacion de carga con forma de balon (misma elipse que el icono
 * "football") — sin texto visible. Un tramo con gradiente lime->dorado
 * recorre el contorno del balon en loop, sobre una pista tenue fija.
 */
export function LoadingSpinner({ variant = 'page', label = 'Cargando' }: LoadingSpinnerProps) {
  const gradientId = useId()

  return (
    <div className={`${styles.wrapper} ${styles[variant]}`} role="status" aria-label={label}>
      <svg viewBox="0 0 24 24" className={styles.spinner} aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-gold)" />
            <stop offset="100%" stopColor="var(--accent-lime)" />
          </linearGradient>
        </defs>
        <ellipse className={styles.track} cx="12" cy="12" rx="9" ry="6" transform="rotate(-40 12 12)" />
        <path className={styles.laces} d="M7.5 16.5l9-9M10.8 13.2l1.3-1.3M12.9 11.1l1.3-1.3" />
        <ellipse
          className={styles.arc}
          cx="12"
          cy="12"
          rx="9"
          ry="6"
          transform="rotate(-40 12 12)"
          stroke={`url(#${gradientId})`}
        />
      </svg>
    </div>
  )
}
