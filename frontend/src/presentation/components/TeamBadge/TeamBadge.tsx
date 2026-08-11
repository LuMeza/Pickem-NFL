import { useState } from 'react'
import { contrastTextColor, getTeamColors } from './teamColors'
import { getTeamLogoUrl } from './teamLogos'
import styles from './TeamBadge.module.css'

export interface TeamBadgeProps {
  teamId: string
  size?: 'sm' | 'md' | 'lg'
  /** 'solid' (default): respaldo claro opaco, usado en casi toda la app. 'subtle': respaldo claro semi-transparente — para contextos donde ya hay marca de color propia (ej. la tarjeta de pick) y un cuadro blanco solido se siente muy "curita". Sigue dando contraste a logos con colores de marca oscuros (Bears, Jaguars, Cowboys...). */
  background?: 'solid' | 'subtle'
}

/**
 * Escudo de equipo: logo oficial cargado desde el CDN de ESPN, con
 * respaldo a un badge de color de marca si la imagen no carga (offline,
 * CDN caido, o un id de equipo sin logo mapeado).
 */
export function TeamBadge({ teamId, size = 'md', background = 'solid' }: TeamBadgeProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const { primary, secondary } = getTeamColors(teamId)
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md

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

  const backgroundClass = background === 'subtle' ? styles.logoBadgeSubtle : styles.logoBadge
  return (
    <span className={`${styles.badge} ${backgroundClass} ${sizeClass}`}>
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
