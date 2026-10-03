import { Link } from 'react-router-dom'
import { useCountdown } from '@/presentation/hooks/useCountdown'
import { useTheme } from '@/presentation/hooks/useTheme'
import { Logo } from '@/presentation/components/Logo/Logo'
import { Icon } from '@/presentation/components/Icon/Icon'
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
  const { theme, toggleTheme } = useTheme()
  const nextThemeLabel = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        <Logo size={26} />
        <span className={styles.brandText}>Pickem NFL</span>
      </Link>
      {(groupName || weekLabel) && (
        <div className={styles.context}>
          {groupName && <span>{groupName}</span>}
          {groupName && weekLabel && (
            <span className={styles.contextDot} aria-hidden="true">
              ·
            </span>
          )}
          {weekLabel && <span>{weekLabel}</span>}
        </div>
      )}
      {countdownLabel && (
        <span className={styles.countdown}>
          <span className={styles.countdownLabel}>Picks cierran en</span>
          <span className={styles.countdownValue}>{countdownLabel}</span>
        </span>
      )}
      <div className={styles.actions}>
        <button
          type="button"
          className={`button-secondary ${styles.themeToggle}`}
          onClick={toggleTheme}
          aria-label={nextThemeLabel}
          title={nextThemeLabel}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>
        {onSignOut && (
          <button type="button" className={`button-secondary ${styles.signOut}`} onClick={onSignOut}>
            Salir
          </button>
        )}
      </div>
    </header>
  )
}
