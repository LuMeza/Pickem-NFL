import type { CSSProperties, ReactNode } from 'react'
import { usePrefersReducedMotion } from '@/presentation/hooks/usePrefersReducedMotion'
import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './PredictionCard.module.css'

export interface PredictionOption {
  id: string
  label: string
  /** Opcional: escudo/ícono del equipo, mostrado arriba del label (ver TeamBadge). */
  logo?: ReactNode
}

/**
 * unpicked: sin elegir, opciones disponibles.
 * picked: elegido, aun no cierra — opciones siguen disponibles para cambiar
 *   de opinion, la elegida queda resaltada.
 * locked: bloqueada — sin acceso o partido ya cerrado sin resultado cargado. Sin flip.
 * closed: partido con resultado oficial — unico estado que voltea la carta,
 *   revela acierto/fallo, sin interaccion.
 */
export type PredictionCardStatus = 'unpicked' | 'picked' | 'locked' | 'closed'

interface PredictionCardCommonProps {
  status: PredictionCardStatus
  selectedOptionId?: string | null
  /** Solo relevante si status === 'closed'. */
  correct?: boolean
  /** Anillo dorado (>24h) vs rojo (<2h) al cierre, solo si status === 'picked'. */
  urgent?: boolean
  /** Color de marca del equipo elegido (hex) — tine el resaltado y el reverso en vez del lima generico. */
  pickedAccent?: string
  onSelect?: (optionId: string) => void
}

interface PredictionCardBinaryProps extends PredictionCardCommonProps {
  variant: 'binary'
  options: readonly [PredictionOption, PredictionOption]
}

interface PredictionCardTripleProps extends PredictionCardCommonProps {
  variant: 'triple'
  options: readonly [PredictionOption, PredictionOption, PredictionOption]
}

export type PredictionCardProps = PredictionCardBinaryProps | PredictionCardTripleProps

/**
 * Tareas 3.1-3.7 (sistema-diseno-ui): componente de carta de prediccion
 * compartido entre Pickem Semanal, Survivor y Playoffs (ver design.md
 * decision 4). Un solo componente parametrizable por `variant` y `status`,
 * en vez de una implementacion por modulo.
 *
 * El pick se hace y se cambia tocando directo la opcion (como cualquier
 * selector) — la elegida queda resaltada. El volteo de carta se reserva
 * unicamente para `closed` (revelar acierto/fallo): ahi la animacion
 * comunica algo nuevo. Voltear solo para "confirmar" un pick que el usuario
 * ya conoce agregaba un paso extra sin payoff (feedback de producto).
 */
export function PredictionCard(props: PredictionCardProps) {
  const { status, selectedOptionId, correct, urgent, pickedAccent, onSelect, variant, options } = props
  const prefersReducedMotion = usePrefersReducedMotion()
  const flipped = status === 'closed'
  const selected = options.find((option) => option.id === selectedOptionId) ?? null
  const accentStyle = pickedAccent ? ({ '--picked-accent': pickedAccent } as CSSProperties) : undefined
  const optionsDisabled = status === 'locked' || status === 'closed'

  function handleSelect(optionId: string) {
    if (optionsDisabled || !onSelect) return
    onSelect(optionId)
  }

  return (
    <div className={styles.scene}>
      <div
        className={`${styles.card} glass-surface`}
        data-flipped={flipped}
        data-reduced-motion={prefersReducedMotion}
        data-status={status}
        style={accentStyle}
      >
        <div className={`${styles.face} ${styles.front}`} aria-hidden={flipped}>
          {status === 'locked' && (
            <span className={styles.lockIcon} aria-label="Bloqueada">
              <Icon name="lock" size={14} />
            </span>
          )}
          {variant === 'binary' ? (
            <div className={styles.vsRow}>
              <OptionButton
                option={options[0]}
                disabled={optionsDisabled}
                selected={options[0].id === selectedOptionId}
                urgent={urgent}
                onSelect={handleSelect}
              />
              <span className={styles.vsLabel}>VS</span>
              <OptionButton
                option={options[1]}
                disabled={optionsDisabled}
                selected={options[1].id === selectedOptionId}
                urgent={urgent}
                onSelect={handleSelect}
              />
            </div>
          ) : (
            <div className={styles.tripleRow}>
              {options.map((option) => {
                const isSelected = option.id === selectedOptionId
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={styles.tripleOption}
                    data-selected={isSelected}
                    data-urgent={isSelected && urgent}
                    disabled={optionsDisabled}
                    onClick={() => handleSelect(option.id)}
                  >
                    {isSelected && (
                      <Icon name="check" size={14} />
                    )}
                    {option.logo && <span className={styles.tripleOptionLogo}>{option.logo}</span>}
                    <span className={styles.tripleOptionLabel}>{option.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className={`${styles.face} ${styles.back}`} aria-hidden={!flipped}>
          {status === 'closed' && (
            <span
              className={`${styles.resultBadge} ${correct ? styles.resultCorrect : styles.resultIncorrect}`}
              aria-label={correct ? 'Acierto' : 'Fallo'}
              role="img"
            >
              {correct ? '✓' : '✕'}
            </span>
          )}
          <div className={styles.pickedLabel}>
            <span>{selected?.label ?? ''}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function OptionButton({
  option,
  disabled,
  selected,
  urgent,
  onSelect,
}: {
  option: PredictionOption
  disabled: boolean
  selected: boolean
  urgent?: boolean
  onSelect: (optionId: string) => void
}) {
  return (
    <button
      type="button"
      className={styles.optionButton}
      data-selected={selected}
      data-urgent={selected && urgent}
      disabled={disabled}
      onClick={() => onSelect(option.id)}
    >
      {selected && (
        <span className={styles.selectedBadge}>
          <Icon name="check" size={12} />
        </span>
      )}
      {option.logo}
      <span className={styles.optionLabel}>{option.label}</span>
    </button>
  )
}
