import { useState } from 'react'
import { contrastTextColor, getTeamColors } from './teamColors'
import { getTeamLogoUrl } from './teamLogos'
import styles from './TeamBadge.module.css'

export interface TeamBadgeProps {
  teamId: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const SIZE_CLASS = { xs: 'xs', sm: 'sm', md: 'md', lg: 'lg' } as const

/**
 * Escudo de equipo: logo oficial cargado desde el CDN de ESPN, con
 * respaldo a un badge de color de marca si la imagen no carga (offline,
 * CDN caido, o un id de equipo sin logo mapeado).
 */
export function TeamBadge({ teamId, size = 'md' }: TeamBadgeProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const { primary, secondary } = getTeamColors(teamId)
  const sizeClass = styles[SIZE_CLASS[size]]

  if (imageFailed) {
    return (
      <span
        className={`${styles.badge} ${sizeClass}`}
        style={{
          background: `linear-gradient(155deg, ${primary} 0%, ${secondary} 130%)`,
          color: contrastTextColor(primary),
        }}
        aria-hidden="true"
      >
        {teamId}
      </span>
    )
  }

  return (
    <span className={`${styles.badge} ${styles.logoBadge} ${sizeClass}`}>
      <img
        src={getTeamLogoUrl(teamId)}
        alt=""
        className={styles.logoImg}
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    </span>
  )
}
