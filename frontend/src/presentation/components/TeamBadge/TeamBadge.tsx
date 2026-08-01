import { useState } from 'react'
import { getTeamColors } from './teamColors'
import { getTeamLogoUrl } from './teamLogos'
import styles from './TeamBadge.module.css'

export interface TeamBadgeProps {
  teamId: string
  size?: 'sm' | 'md' | 'lg'
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastTextColor(bgHex: string): string {
  return relativeLuminance(hexToRgb(bgHex)) > 0.35 ? '#0B0F14' : '#F4F6F8'
}

/**
 * Escudo de equipo: logo oficial cargado desde el CDN de ESPN, con
 * respaldo a un badge de color de marca si la imagen no carga (offline,
 * CDN caido, o un id de equipo sin logo mapeado).
 */
export function TeamBadge({ teamId, size = 'md' }: TeamBadgeProps) {
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
