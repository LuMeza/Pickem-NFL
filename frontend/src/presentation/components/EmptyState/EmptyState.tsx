import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  message: string
  action?: ReactNode
}

/**
 * Tarea 4.2 (sistema-diseno-ui): componente reutilizable de estado
 * vacio/error. Tono directo, sin disculpas, sin emojis (ver
 * doc/design-system.md §7 y EMPTY_STATE_COPY para los textos estandar).
 */
export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className={`${styles.emptyState} glass-surface`} role="status">
      <p className={styles.message}>{message}</p>
      {action}
    </div>
  )
}
