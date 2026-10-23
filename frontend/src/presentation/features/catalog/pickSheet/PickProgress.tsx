import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { weeklyPickGroupDeadline } from '@/core/rules/weeklyPickGroupDeadline'
import type { Game } from '@/core/entities/catalog'
import { getReadableAccent, getTeamColors } from '@/presentation/components/TeamBadge/teamColors'
import type { GamePickView } from './PickRow'
import styles from './PickSheet.module.css'

const URGENT_THRESHOLD_MS = 2 * 60 * 60 * 1000
const CELEBRATE_MS = 1600

/**
 * true durante un momento cuando `complete` pasa de false a true en esta
 * visita (el último pick que faltaba). Abrir una semana ya completa no lo
 * dispara: es la única animación de la hoja y solo marca ese logro.
 */
function useJustCompleted(complete: boolean): boolean {
  const previous = useRef(complete)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const wasComplete = previous.current
    previous.current = complete
    if (!complete || wasComplete) return
    setActive(true)
    const timeoutId = setTimeout(() => setActive(false), CELEBRATE_MS)
    return () => clearTimeout(timeoutId)
  }, [complete])

  return active
}

/** Color de marca puro (tema claro) y su variante legible sobre fondo oscuro. */
function segmentStyle(view: GamePickView): CSSProperties | undefined {
  if (view.pickedValue === 'tie') return { '--segment-color': 'var(--accent-silver)' } as CSSProperties
  const teamId =
    view.pickedValue === 'home' ? view.game.homeTeamId : view.pickedValue === 'away' ? view.game.awayTeamId : null
  if (!teamId) return undefined
  return {
    '--segment-color': getReadableAccent(teamId),
    '--segment-color-light': getTeamColors(teamId).primary,
  } as CSSProperties
}

function segmentLabel(view: GamePickView): string {
  const matchup = `${view.game.homeTeamId} vs ${view.game.awayTeamId}`
  if (view.pickedValue === 'home') return `${matchup}: elegiste ${view.game.homeTeamId}`
  if (view.pickedValue === 'away') return `${matchup}: elegiste ${view.game.awayTeamId}`
  if (view.pickedValue === 'tie') return `${matchup}: elegiste empate`
  return view.locked ? `${matchup}: cerrado sin pick` : `${matchup}: sin pick`
}

/** Próximo cierre de un partido que todavía acepta picks, o null si ya cerró todo. */
export function nextDeadline(views: GamePickView[], weekGames: Game[], nowMs: number): Date | null {
  const open = views
    .filter((view) => !view.locked)
    .map((view) => weeklyPickGroupDeadline(weekGames, view.game.kickoffAt))
    .filter((deadline): deadline is Date => deadline !== null && deadline.getTime() > nowMs)
  if (open.length === 0) return null
  return new Date(Math.min(...open.map((deadline) => deadline.getTime())))
}

export function formatDeadline(date: Date): string {
  const day = date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }).replace('.', '')
  const time = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return `${day}, ${time}`
}

/**
 * Tira fija arriba de la hoja: un segmento por partido, en orden de
 * kickoff, pintado con el color del equipo elegido. De un vistazo se ve
 * cuántos picks faltan y en qué partidos; tocar un segmento lleva al partido.
 */
export function PickProgress({
  views,
  weekGames,
  nowMs,
}: {
  views: GamePickView[]
  weekGames: Game[]
  nowMs: number
}) {
  const picked = views.filter((view) => view.pickedValue !== null).length
  const deadline = nextDeadline(views, weekGames, nowMs)
  const urgent = deadline !== null && deadline.getTime() - nowMs < URGENT_THRESHOLD_MS
  const complete = views.length > 0 && picked === views.length
  const celebrate = useJustCompleted(complete)

  function scrollToGame(gameId: string) {
    document.getElementById(`game-${gameId}`)?.scrollIntoView({ block: 'center' })
  }

  return (
    <div className={styles.progress}>
      <div className={styles.progressText}>
        <span className={styles.progressCount}>
          {celebrate ? (
            <strong>Semana completa</strong>
          ) : (
            <>
              <strong>{picked}</strong> de {views.length} picks
            </>
          )}
        </span>
        <span className={styles.progressDeadline} data-urgent={urgent}>
          {deadline ? `Cierra ${formatDeadline(deadline)}` : 'Semana cerrada'}
        </span>
      </div>
      <PickSegments views={views} onSelect={scrollToGame} celebrate={celebrate} />
    </div>
  )
}

/**
 * Solo la tira de segmentos. Con `onSelect` cada segmento es un botón (hoja
 * de picks); sin él son decorativos, para usarla dentro de un link (Inicio).
 */
export function PickSegments({
  views,
  onSelect,
  size = 'md',
  celebrate = false,
}: {
  views: GamePickView[]
  onSelect?: (gameId: string) => void
  /** 'lg' = barra más alta, para el hero de Inicio. */
  size?: 'md' | 'lg'
  /** Recorre la tira con una ola de brillo: solo al completar la semana. */
  celebrate?: boolean
}) {
  return (
    <ol
      className={styles.segments}
      data-size={size}
      data-celebrate={celebrate}
      aria-hidden={onSelect ? undefined : true}
    >
      {views.map((view, index) => {
        const colorStyle = segmentStyle(view)
        const common = {
          className: styles.segment,
          'data-filled': colorStyle !== undefined,
          'data-locked': view.locked,
          'data-correct': view.correct ?? undefined,
          // --i escalona la ola de "semana completa" de izquierda a derecha.
          style: { ...colorStyle, '--i': index } as CSSProperties,
        }
        return (
          <li key={view.game.id}>
            {onSelect ? (
              <button
                type="button"
                {...common}
                aria-label={segmentLabel(view)}
                title={segmentLabel(view)}
                onClick={() => onSelect(view.game.id)}
              />
            ) : (
              <span {...common} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
