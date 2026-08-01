import { useState } from 'react'
import { getPlayerHeadshotUrl } from './playerHeadshots'
import styles from './PlayerPhoto.module.css'

export interface PlayerPhotoProps {
  playerId: string
  jerseyNumber: string | null
}

/** Foto de jugador con respaldo al numero de camiseta si ESPN no tiene headshot (rookies, practice squad, id sin mapear). */
export function PlayerPhoto({ playerId, jerseyNumber }: PlayerPhotoProps) {
  const [imageFailed, setImageFailed] = useState(false)

  if (imageFailed) {
    return (
      <span className={styles.photo} aria-hidden="true">
        <span className={styles.fallback}>{jerseyNumber ?? '--'}</span>
      </span>
    )
  }

  return (
    <span className={styles.photo}>
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
