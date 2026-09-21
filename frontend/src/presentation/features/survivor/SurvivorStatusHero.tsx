import type { ReactNode } from 'react'
import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './SurvivorStatusHero.module.css'

export type SurvivorHeroKind = 'alive' | 'revive' | 'out'

const TOTAL_LIVES = 3

const HEADLINE: Record<SurvivorHeroKind, string> = {
  alive: 'Sigues vivo',
  revive: 'Puedes revivir',
  out: 'Quedaste fuera',
}

interface SurvivorStatusHeroProps {
  kind: SurvivorHeroKind
  /** Vida vigente (1-3). En "revive" es la vida que acabas de perder. */
  currentLife: number
  /** Una o dos líneas que explican qué hacer ahora. */
  children: ReactNode
}

type Slot = 'spent' | 'current' | 'lost' | 'spare'

function slotFor(life: number, currentLife: number, kind: SurvivorHeroKind): Slot {
  if (life < currentLife) return 'spent'
  if (life === currentLife) return kind === 'alive' ? 'current' : 'lost'
  return 'spare'
}

const SLOT_LABEL: Record<Slot, string> = {
  spent: 'usada',
  current: 'en juego',
  lost: 'perdida',
  spare: 'disponible',
}

/**
 * Estado del jugador en una sola mirada: un titular grande con el color del riesgo y la fila de sus 3 vidas
 * (usada / en juego / disponible), seguido de lo único que tiene que hacer ahora.
 */
export function SurvivorStatusHero({ kind, currentLife, children }: SurvivorStatusHeroProps) {
  const slots = Array.from({ length: TOTAL_LIVES }, (_, index) => slotFor(index + 1, currentLife, kind))
  const summary = slots.map((slot, index) => `vida ${index + 1} ${SLOT_LABEL[slot]}`).join(', ')

  return (
    <div className={`${styles.hero} glass-surface`} data-kind={kind} role="status">
      <div className={styles.top}>
        <div className={styles.text}>
          <span className={styles.kicker}>Tu estado</span>
          <h2 className={styles.headline}>{HEADLINE[kind]}</h2>
        </div>
        <div className={styles.rail} role="img" aria-label={summary}>
          {slots.map((slot, index) => (
            <span key={index} className={styles.slot} data-slot={slot}>
              <Icon name="heart" size={20} />
              <span className={styles.slotLabel}>{SLOT_LABEL[slot]}</span>
            </span>
          ))}
        </div>
      </div>
      <div className={styles.action}>{children}</div>
    </div>
  )
}
