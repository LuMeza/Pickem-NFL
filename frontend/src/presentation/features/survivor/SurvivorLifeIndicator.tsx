import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './SurvivorLifeIndicator.module.css'

const TOTAL_LIVES = 3

const LIFE_TONE: Record<number, string> = {
  1: styles.toneSafe ?? '',
  2: styles.toneWarning ?? '',
  3: styles.toneCritical ?? '',
}

/**
 * La vida es secuencial, no acumulable — nunca hay "3 vidas juntas" (a
 * diferencia de un contador de vidas extra tipo videojuego clasico). Un
 * unico corazon representa la vida vigente, con color que escala de riesgo
 * (verde -> dorado -> rojo, con pulso en la ultima) segun currentLife; el
 * track de puntos marca en que intento estas, no cuantas vidas "tenes".
 */
export function SurvivorLifeIndicator({ currentLife }: { currentLife: number }) {
  const tone = LIFE_TONE[currentLife] ?? LIFE_TONE[1]
  const lives = Array.from({ length: TOTAL_LIVES }, (_, index) => index + 1)

  return (
    <span className={styles.indicator}>
      <span className={`${styles.heart} ${tone}`}>
        <Icon name="heart" size={16} />
      </span>
      <span className={styles.label}>Vida {currentLife}</span>
      <span className={styles.track} role="img" aria-label={`Intento ${currentLife} de ${TOTAL_LIVES}`}>
        {lives.map((life) => {
          const dotClass =
            life < currentLife ? styles.dotUsed : life === currentLife ? `${styles.dotCurrent} ${tone}` : styles.dotUpcoming
          return <span key={life} className={`${styles.dot} ${dotClass}`} />
        })}
      </span>
    </span>
  )
}
