import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PlayerPhoto } from '@/presentation/components/PlayerPhoto/PlayerPhoto'
import { Modal } from '@/presentation/components/Modal/Modal'
import { getPositionLabel } from '@/presentation/features/catalog/nflPositions'
import { formatBirthDate, formatHeight, formatWeight } from '@/presentation/features/catalog/playerBio'
import { getAvailability, type Availability, type AvailabilityTone } from '@/presentation/features/catalog/playerAvailability'
import type { Player } from '@/core/entities/catalog'
import styles from './PlayerCard.module.css'

export interface PlayerCardProps {
  player: Player
  /** Posición dentro de la grilla visible — controla el delay del stagger de entrada. */
  index: number
}

interface PreviewPosition {
  top: number
  left: number
}

interface BioField {
  label: string
  value: string
  tone?: AvailabilityTone
}

const TONE_CLASS: Record<AvailabilityTone, string> = {
  active: 'toneActive',
  questionable: 'toneQuestionable',
  injured: 'toneInjured',
}

const PREVIEW_WIDTH = 220

function supportsHoverPreview(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

/** Posición del popover en coordenadas de viewport (para `position: fixed`), clampeada para no salirse por el borde derecho. */
function previewPositionFor(card: HTMLElement): PreviewPosition {
  const rect = card.getBoundingClientRect()
  const left = Math.min(rect.left, window.innerWidth - PREVIEW_WIDTH - 8)
  return { top: rect.bottom + 6, left: Math.max(8, left) }
}

/**
 * `null` si ESPN no mandó ningún dato de estatus — sin eso, `getAvailability`
 * caería en "Activo" por defecto, y mostrarlo igual sería sugerir un dato
 * que en realidad no tenemos.
 */
function availabilityFor(player: Player): Availability | null {
  if (!player.status && !player.injuryStatus) return null
  return getAvailability(player)
}

function bioFields(player: Player): BioField[] {
  const fields: BioField[] = []
  const availability = availabilityFor(player)
  if (availability) fields.push({ label: 'Disponibilidad', value: availability.label, tone: availability.tone })
  if (player.injuryDetail) fields.push({ label: 'Detalle', value: player.injuryDetail })
  const height = formatHeight(player.heightIn)
  const weight = formatWeight(player.weightLbs)
  if (height && weight) fields.push({ label: 'Estatura / Peso', value: `${height}, ${weight}` })
  const birth = formatBirthDate(player.birthDate, player.age)
  if (birth) fields.push({ label: 'Nacimiento', value: birth })
  if (player.college) fields.push({ label: 'Universidad', value: player.college })
  if (player.experienceYears !== null) {
    fields.push({ label: 'Experiencia', value: player.experienceYears === 0 ? 'Rookie' : `${player.experienceYears} temporadas` })
  }
  if (player.status) fields.push({ label: 'Estatus', value: player.status })
  return fields
}

/**
 * Card de jugador en la plantilla, con preview de su ficha (altura, peso,
 * edad, universidad, experiencia, estatus) — datos que ya vienen en el
 * mismo roster de ESPN que sincroniza sync-espn-roster, sin llamadas extra
 * por jugador.
 *
 * El preview de hover se renderiza en un portal a `document.body` (no como
 * hijo posicionado dentro de la card): las cards usan `glass-surface`, que
 * trae `backdrop-filter`, y eso crea un stacking context propio por card —
 * con position:absolute + z-index normal, el popover de una fila quedaba
 * pintado *debajo* de las cards de la fila siguiente. El portal evita el
 * problema posicionando el popover fuera de cualquier ancestro con
 * backdrop-filter/transform.
 *
 * En dispositivos con mouse real el preview aparece con hover (chequeado en
 * JS via `matchMedia('(hover: hover)')` para que nunca aparezca "pegado" en
 * touch); en cualquier dispositivo, click/tap abre el detalle completo en
 * un modal.
 */
export function PlayerCard({ player, index }: PlayerCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [previewPos, setPreviewPos] = useState<PreviewPosition | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current || !supportsHoverPreview()) return
    setPreviewPos(previewPositionFor(cardRef.current))
  }, [])

  const handleMouseLeave = useCallback(() => setPreviewPos(null), [])

  const positionLabel = getPositionLabel(player.position)
  const availability = availabilityFor(player)
  const fields = bioFields(player)

  return (
    <>
      <div
        ref={cardRef}
        className={`${styles.playerCard} glass-surface glass-interactive`}
        style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
        role="button"
        tabIndex={0}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setModalOpen(true)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          setModalOpen(true)
        }}
      >
        <span className={styles.playerPhotoWrap}>
          <PlayerPhoto playerId={player.id} jerseyNumber={player.jerseyNumber} />
          {availability && availability.tone !== 'active' && (
            <span className={`${styles.availabilityBadge} ${styles[TONE_CLASS[availability.tone]]}`} title={availability.label} />
          )}
        </span>
        <span className={styles.playerName}>{player.fullName}</span>
        <span className={styles.playerMeta}>
          {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}{' '}
          <span title={positionLabel ?? undefined}>{player.position ?? ''}</span>
        </span>
      </div>

      {previewPos &&
        createPortal(
          <div
            className={`${styles.statsPreview} glass-surface`}
            style={{ top: previewPos.top, left: previewPos.left, width: PREVIEW_WIDTH }}
          >
            <span className={styles.statsPreviewName}>{player.fullName}</span>
            {fields.length === 0 && <span className={styles.statsPreviewHint}>Sin ficha disponible</span>}
            {fields.length > 0 && (
              <dl className={styles.statsList}>
                {fields.map((field) => (
                  <div key={field.label} className={styles.statItem}>
                    <dt>{field.label}</dt>
                    <dd className={field.tone ? styles[TONE_CLASS[field.tone]] : undefined}>{field.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>,
          document.body,
        )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className={`${styles.modalContent} glass-surface`}>
          <button type="button" className={styles.closeButton} onClick={() => setModalOpen(false)} aria-label="Cerrar">
            ×
          </button>
          <div className={styles.modalHeader}>
            <PlayerPhoto playerId={player.id} jerseyNumber={player.jerseyNumber} size="lg" />
            <div>
              <span className={styles.modalName}>{player.fullName}</span>
              <span className={styles.modalMeta}>
                {player.jerseyNumber ? `#${player.jerseyNumber} · ` : ''}
                {positionLabel ?? player.position ?? ''}
              </span>
            </div>
          </div>

          {fields.length === 0 && (
            <p className={styles.modalHint}>Sin ficha disponible — hace falta re-sincronizar la plantilla.</p>
          )}
          {fields.length > 0 && (
            <dl className={styles.statsList}>
              {fields.map((field) => (
                <div key={field.label} className={styles.statItem}>
                  <dt>{field.label}</dt>
                  <dd className={field.tone ? styles[TONE_CLASS[field.tone]] : undefined}>{field.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Modal>
    </>
  )
}
