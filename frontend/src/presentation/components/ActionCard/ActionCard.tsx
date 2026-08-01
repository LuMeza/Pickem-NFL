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
  /** Modulo todavia no disponible (ej. Playoffs) — se ve pero no navega. */
  disabled?: boolean
}

/** Tarjeta glass para navegacion (dashboards de Inicio/Admin) — consistente con el resto del sistema de diseno. */
export function ActionCard({ to, icon, title, description, featured = false, disabled = false }: ActionCardProps) {
  const className = `${styles.card} ${featured ? styles.featured : ''} ${disabled ? styles.disabled : 'glass-surface glass-interactive'}`

  if (disabled) {
    return (
      <span className={className} aria-disabled="true">
        <span className={styles.iconWrap}>
          <Icon name={icon} size={featured ? 28 : 22} />
        </span>
        <span className={styles.body}>
          <span className={styles.title}>{title}</span>
          {description && <span className={styles.description}>{description}</span>}
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
      </span>
    </Link>
  )
}
