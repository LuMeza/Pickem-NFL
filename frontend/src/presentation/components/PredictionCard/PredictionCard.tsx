import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
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
 * picked: elegido, aún no cierra — opciones siguen disponibles para cambiar
 *   de opinion, la elegida queda resaltada.
 * locked: bloqueada — sin acceso o partido ya cerrado sin resultado cargado. Sin flip.
 * closed: partido con resultado oficial — único estado que voltea la carta,
 *   revela acierto/fallo, sin interacción.
 */
export type PredictionCardStatus = 'unpicked' | 'picked' | 'locked' | 'closed'

interface PredictionCardCommonProps {
  status: PredictionCardStatus
  selectedOptionId?: string | null
  /** Solo relevante si status === 'closed'. */
  correct?: boolean
  /** Opcion que gano el partido (id de `options`). Solo relevante si status === 'closed'. */
  outcomeOptionId?: string | null
  /** Anillo dorado (>24h) vs rojo (<2h) al cierre, solo si status === 'picked'. */
  urgent?: boolean
  /** Color de marca del equipo elegido (hex) — tiñe el resaltado y el reverso en vez del lima genérico. */
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

const FLIP_DURATION_MS = 300

/**
 * Tareas 3.1-3.7 (sistema-diseno-ui): componente de carta de predicción
 * compartido entre Pickem Semanal, Survivor y Playoffs (ver design.md
 * decision 4). Un solo componente parametrizable por `variant` y `status`,
 * en vez de una implementación por módulo.
 *
 * El pick se hace y se cambia tocando directo la opción (como cualquier
 * selector) — la elegida queda resaltada. El volteo de carta se reserva
 * únicamente para `closed` (revelar acierto/fallo): ahi la animación
 * comunica algo nuevo. Voltear solo para "confirmar" un pick que el usuario
 * ya conoce agregaba un paso extra sin payoff (feedback de producto).
 *
 * El "volteo" NO es un rotateY 3D con backface-visibility: ese patrón
 * depende de que el navegador oculte correctamente la cara que queda de
 * espaldas, y en renderizado por software (entornos sin GPU, remoto,
 * ciertas VMs — confirmado en producción con un usuario real) Chromium no
 * la oculta y termina pintando el frente espejado en vez del reverso. En
 * vez de eso, solo se monta una cara a la vez (`showBack`) y la animación es
 * un achique a ancho 0 que dispara el cambio de contenido exactamente a la
 * mitad (ver useEffect) — funciona igual sin importar el navegador porque
 * nunca depende de esconder una cara "de atrás".
 */
export function PredictionCard(props: PredictionCardProps) {
  const { status, selectedOptionId, correct, outcomeOptionId, urgent, pickedAccent, onSelect, variant, options } =
    props
  const prefersReducedMotion = usePrefersReducedMotion()
  const flipped = status === 'closed'
  const [showBack, setShowBack] = useState(flipped)
  const [flipping, setFlipping] = useState(false)
  const wasFlipped = useRef(flipped)

  useEffect(() => {
    if (flipped === wasFlipped.current) return
    wasFlipped.current = flipped
    if (prefersReducedMotion) {
      setShowBack(flipped)
      return
    }
    setFlipping(true)
    const swapTimer = setTimeout(() => setShowBack(flipped), FLIP_DURATION_MS / 2)
    const endTimer = setTimeout(() => setFlipping(false), FLIP_DURATION_MS)
    return () => {
      clearTimeout(swapTimer)
      clearTimeout(endTimer)
    }
  }, [flipped, prefersReducedMotion])

  const selected = options.find((option) => option.id === selectedOptionId) ?? null
  const winner = options.find((option) => option.id === outcomeOptionId) ?? null
  const accentStyle = pickedAccent ? ({ '--picked-accent': pickedAccent } as CSSProperties) : undefined
  const optionsDisabled = status === 'locked' || status === 'closed'

  function handleSelect(optionId: string) {
    if (optionsDisabled || !onSelect) return
    onSelect(optionId)
  }

  return (
    <div className={styles.card} data-flipping={flipping} data-status={status} style={accentStyle}>
      {showBack ? (
        <>
          <span
            className={`${styles.resultBadge} ${correct ? styles.resultCorrect : styles.resultIncorrect}`}
            aria-label={correct ? 'Acierto' : 'Fallo'}
            role="img"
          >
            {correct ? '✓' : '✕'}
          </span>
          <div className={styles.resultSummary}>
            <div className={styles.resultRow}>
              <span className={styles.resultRowCaption}>
                <Icon name="trophy" size={11} /> Ganó
              </span>
              <span className={styles.resultRowValue}>
                {winner?.logo}
                <span>{winner?.label ?? ''}</span>
              </span>
            </div>
            <div className={styles.resultRow} data-correct={correct}>
              <span className={styles.resultRowCaption}>Tu pick</span>
              <span className={styles.resultRowValue}>
                {selected?.logo}
                <span>{selected?.label ?? ''}</span>
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
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
                    {isSelected && <Icon name="check" size={14} />}
                    {option.logo && <span className={styles.tripleOptionLogo}>{option.logo}</span>}
                    <span className={styles.tripleOptionLabel}>{option.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
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
