import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './AchievementBadge.module.css'

export interface AchievementBadgeProps {
  title: string
  description: string
  unlocked: boolean
}

/**
 * Badge de logro del perfil (mismo patron que TeamBadge: icono + color por
 * estado). Desbloqueado en `--accent-gold` (reservado por
 * doc/design-system.md exclusivamente para logros/ranking de perfil),
 * atenuado y con candado cuando todavia no se obtuvo.
 */
export function AchievementBadge({ title, description, unlocked }: AchievementBadgeProps) {
  return (
    <div
      className={`${styles.badge} ${unlocked ? styles.unlocked : styles.locked}`}
      title={description}
      aria-label={`${title}: ${description}`}
    >
      <span className={styles.icon} aria-hidden="true">
        <Icon name={unlocked ? 'trophy' : 'lock'} size={22} />
      </span>
      <span className={styles.title}>{title}</span>
      <span className={`${styles.description} text-body-sm text-muted`}>{description}</span>
    </div>
  )
}
