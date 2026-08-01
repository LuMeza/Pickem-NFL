import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './SurvivorLifeIndicator.module.css'

/**
 * Simbologia de vida extra: un corazon por cada vida extra ya consumida (solo
 * aparecen si perdiste alguna vez — la vida original, la 1, no suma corazon).
 */
export function SurvivorLifeIndicator({ currentLife }: { currentLife: number }) {
  const extraLivesUsed = Math.max(0, currentLife - 1)

  return (
    <span className={styles.indicator}>
      <span>Vida {currentLife}</span>
      {extraLivesUsed > 0 && (
        <span className={styles.hearts} aria-label={`${extraLivesUsed} vida(s) extra usada(s)`}>
          {Array.from({ length: extraLivesUsed }).map((_, index) => (
            <Icon key={index} name="heart" size={13} />
          ))}
        </span>
      )}
    </span>
  )
}
