import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import styles from './StatTile.module.css'

export interface StatTileProps {
  to: string
  icon: IconName
  kicker: string
  /** Dato principal en grande (ej. "3° de 12", "Vivo · 2 vidas"). Ignorado mientras loading es true. */
  value?: string
  /** Línea secundaria, opcional (ej. "24 aciertos"). */
  detail?: string
  loading?: boolean
  /** Resalta la tarjeta cuando requiere acción del usuario (ej. picks pendientes). */
  urgent?: boolean
}

/** Tarjeta de resumen personal para el dashboard de Inicio — a diferencia de ActionCard, muestra un dato en vez de solo navegar. */
export function StatTile({ to, icon, kicker, value, detail, loading = false, urgent = false }: StatTileProps) {
  return (
    <Link to={to} className={`${styles.tile} ${urgent ? styles.urgent : ''} glass-surface glass-interactive`}>
      <span className={styles.iconWrap}>
        <Icon name={icon} size={20} />
      </span>
      <span className={styles.body}>
        <span className={styles.kicker}>{kicker}</span>
        {loading ? (
          <LoadingSpinner variant="inline" />
        ) : (
          <>
            <span className={styles.value}>{value}</span>
            {detail && <span className={styles.detail}>{detail}</span>}
          </>
        )}
      </span>
    </Link>
  )
}
