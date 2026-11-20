import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/presentation/components/Icon/Icon'
import styles from './ActionCard.module.css'

export interface ActionCardProps {
  to: string
  icon: IconName
  title: string
  description?: string
  /** Variante grande de un solo acceso principal (ver Inicio) — ocupa el ancho completo del grid. */
  featured?: boolean
  /** Módulo todavía no disponible (ej. Playoffs) — se ve pero no navega. */
  disabled?: boolean
  /** Tarjeta vertical y más chica (ícono arriba) para accesos secundarios en un grid de dos columnas. */
  compact?: boolean
  /** Ocupa las dos columnas del grid. */
  wide?: boolean
  /** Estado corto bajo la descripción (ej. "Bloqueado"). `active` lo destaca con el acento. */
  badge?: { label: string; tone?: 'neutral' | 'active' }
}

/** Tarjeta glass para navegación (dashboards de Inicio/Admin) — consistente con el resto del sistema de diseño. */
export function ActionCard({
  to,
  icon,
  title,
  description,
  featured = false,
  disabled = false,
  compact = false,
  wide = false,
  badge,
}: ActionCardProps) {
  const className = `${styles.card} ${featured ? styles.featured : ''} ${compact ? styles.compact : ''} ${wide ? styles.wide : ''} ${disabled ? styles.disabled : 'glass-surface glass-interactive'}`

  if (disabled) {
    return (
      <span className={className} aria-disabled="true">
        <span className={styles.iconWrap}>
          <Icon name={icon} size={featured ? 28 : 22} />
        </span>
        <span className={styles.body}>
          <span className={styles.title}>{title}</span>
          {description && <span className={styles.description}>{description}</span>}
          {badge && <span className={`${styles.badge} ${badge.tone === 'active' ? styles.badgeActive : ''}`}>{badge.label}</span>}
        </span>
      </span>
    )
  }

  return (
    <Link to={to} className={className}>
      <span className={styles.iconWrap}>
        <Icon name={icon} size={featured ? 28 : 22} />
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
        {badge && <span className={`${styles.badge} ${badge.tone === 'active' ? styles.badgeActive : ''}`}>{badge.label}</span>}
      </span>
    </Link>
  )
}
