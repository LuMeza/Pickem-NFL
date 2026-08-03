import { Link } from 'react-router-dom'
import { useCountdown } from '@/presentation/hooks/useCountdown'
import { Logo } from '@/presentation/components/Logo/Logo'
import styles from './Header.module.css'

export interface HeaderProps {
  groupName?: string
  weekLabel?: string
  countdownTo?: Date | null
  onSignOut?: () => void
}

/**
 * Tarea 2.3 (sistema-diseno-ui): header persistente con grupo activo,
 * semana/ronda actual y cuenta regresiva. En mobile colapsa a solo
 * marca + cuenta regresiva (grupo/semana ocultos via CSS, ver Header.module.css).
 */
export function Header({ groupName, weekLabel, countdownTo, onSignOut }: HeaderProps) {
  const countdownLabel = useCountdown(countdownTo ?? null)

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        <Logo size={26} />
        Pickem NFL
      </Link>
      {(groupName || weekLabel) && (
        <div className={styles.context}>
          {groupName && <span>{groupName}</span>}
          {weekLabel && <span>{weekLabel}</span>}
        </div>
      )}
      {countdownLabel && (
        <span className={styles.countdown} title="Cierra en">
          {countdownLabel}
        </span>
      )}
      {onSignOut && (
        <button type="button" className={`button-secondary ${styles.signOut}`} onClick={onSignOut}>
          Salir
        </button>
      )}
    </header>
  )
}
