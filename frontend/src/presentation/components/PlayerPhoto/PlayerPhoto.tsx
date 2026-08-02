import { useState } from 'react'
import { getPlayerHeadshotUrl } from './playerHeadshots'
import styles from './PlayerPhoto.module.css'

export interface PlayerPhotoProps {
  playerId: string
  jerseyNumber: string | null
  size?: 'sm' | 'lg'
}

/** Foto de jugador con respaldo al número de camiseta si ESPN no tiene headshot (rookies, practice squad, id sin mapear). */
export function PlayerPhoto({ playerId, jerseyNumber, size = 'sm' }: PlayerPhotoProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const photoClassName = size === 'lg' ? `${styles.photo} ${styles.photoLg}` : styles.photo

  if (imageFailed) {
    return (
      <span className={photoClassName} aria-hidden="true">
        <span className={styles.fallback}>{jerseyNumber ?? '--'}</span>
      </span>
    )
  }

  return (
    <span className={photoClassName}>
      <img
        src={getPlayerHeadshotUrl(playerId)}
        alt=""
        className={styles.img}
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    </span>
  )
}
