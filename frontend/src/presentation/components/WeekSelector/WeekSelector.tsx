import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
import type { Week, WeekType } from '@/core/entities/catalog'
import styles from './WeekSelector.module.css'

const SEGMENT_ORDER: WeekType[] = ['hof', 'pretemporada', 'regular', 'playoffs']

const SEGMENT_LABEL: Record<WeekType, string> = {
  hof: 'Hall of Fame',
  pretemporada: 'Pretemporada',
  regular: 'Regular',
  playoffs: 'Playoffs',
}

const PLAYOFFS_ROUND_LABEL: Record<number, string> = {
  1: 'Wild Card',
  2: 'Divisional',
  3: 'Conference',
  4: 'Super Bowl',
}

function weekLabel(week: Week): string {
  if (week.type === 'playoffs') return PLAYOFFS_ROUND_LABEL[week.number] ?? `Ronda ${week.number}`
  if (week.type === 'hof') return 'Hall of Fame'
  if (week.type === 'pretemporada') return `Pre ${week.number}`
  return `Semana ${week.number}`
}

function sortByNumber(weeks: Week[]): Week[] {
  return [...weeks].sort((a, b) => a.number - b.number)
}

export interface WeekSelectorProps {
  activeWeekId: string
  /** Construye el href de cada semana. Por defecto apunta al calendario de partidos (`/weeks/:id/games`); las pantallas de acceso semanal del pickem lo sobreescriben para quedarse en su propia ruta. */
  linkTo?: (weekId: string) => string
  /** Semanas que no se pueden navegar todavía (ej. Survivor, design.md decision 8 — no adelantarse a una semana futura sin saber si el usuario sigue vivo). Por defecto ninguna semana está deshabilitada. */
  isWeekDisabled?: (week: Week) => boolean
  /** Segmentos de temporada que la pantalla soporta (ej. Survivor solo aplica a `regular`, ver modulo-survivor design.md decision 1). Por defecto, todos. */
  allowedSegments?: WeekType[]
}

/**
 * Selector de semana en dos niveles: segmentos por tipo de temporada
 * (pretemporada/regular/playoffs) + un stepper dentro del segmento activo,
 * con una hoja desplegable para saltar directo. Sustituye a un carrusel plano
 * de +20 chips, que se vuelve lento de recorrer (feedback de UX).
 */
export function WeekSelector({
  activeWeekId,
  linkTo = (weekId) => `/weeks/${weekId}/games`,
  isWeekDisabled = () => false,
  allowedSegments = SEGMENT_ORDER,
}: WeekSelectorProps) {
  const { data: weeks, run } = useListWeeks()
  const navigate = useNavigate()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    run()
  }, [run])

  const activeWeek = weeks?.find((week) => week.id === activeWeekId)

  const segments = useMemo(
    () =>
      weeks
        ? SEGMENT_ORDER.filter((type) => allowedSegments.includes(type) && weeks.some((week) => week.type === type))
        : [],
    [weeks, allowedSegments],
  )
  const activeSegment = activeWeek?.type ?? segments[0]

  const segmentWeeks = useMemo(
    () => (weeks && activeSegment ? sortByNumber(weeks.filter((week) => week.type === activeSegment)) : []),
    [weeks, activeSegment],
  )

  const currentIndex = segmentWeeks.findIndex((week) => week.id === activeWeekId)
  const prevWeek = currentIndex > 0 ? segmentWeeks[currentIndex - 1] : null
  const nextCandidate =
    currentIndex >= 0 && currentIndex < segmentWeeks.length - 1 ? segmentWeeks[currentIndex + 1] : null
  const nextWeek = nextCandidate && !isWeekDisabled(nextCandidate) ? nextCandidate : null

  useEffect(() => {
    if (!isPickerOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setIsPickerOpen(false)
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsPickerOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isPickerOpen])

  if (!weeks || weeks.length === 0 || !activeSegment) return null

  function goToSegment(type: WeekType) {
    const firstOfSegment = sortByNumber(weeks!.filter((week) => week.type === type))[0]
    if (firstOfSegment) navigate(linkTo(firstOfSegment.id))
    setIsPickerOpen(false)
  }

  return (
    <div className={styles.selector}>
      {segments.length > 1 && (
        <div className={styles.segmentGroup} role="tablist" aria-label="Tipo de temporada">
          {segments.map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={type === activeSegment}
              className={`${styles.segmentTab} ${type === activeSegment ? styles.segmentTabActive : ''}`}
              onClick={() => goToSegment(type)}
            >
              {SEGMENT_LABEL[type]}
            </button>
          ))}
        </div>
      )}

      <div className={styles.stepper}>
        <Link
          to={prevWeek ? linkTo(prevWeek.id) : '#'}
          tabIndex={prevWeek ? 0 : -1}
          aria-disabled={!prevWeek}
          className={`${styles.stepButton} ${!prevWeek ? styles.stepButtonDisabled : ''}`}
          onClick={(event) => {
            if (!prevWeek) event.preventDefault()
            setIsPickerOpen(false)
          }}
        >
          <span aria-hidden="true">◀</span>
          <span className={styles.srOnly}>Semana anterior</span>
        </Link>

        <button
          type="button"
          className={styles.currentWeekButton}
          onClick={() => setIsPickerOpen((open) => !open)}
          aria-expanded={isPickerOpen}
        >
          {activeWeek ? weekLabel(activeWeek) : 'Elegir semana'}
        </button>

        <Link
          to={nextWeek ? linkTo(nextWeek.id) : '#'}
          tabIndex={nextWeek ? 0 : -1}
          aria-disabled={!nextWeek}
          className={`${styles.stepButton} ${!nextWeek ? styles.stepButtonDisabled : ''}`}
          onClick={(event) => {
            if (!nextWeek) event.preventDefault()
            setIsPickerOpen(false)
          }}
        >
          <span aria-hidden="true">▶</span>
          <span className={styles.srOnly}>Semana siguiente</span>
        </Link>
      </div>

      {isPickerOpen && (
        <div className={styles.picker} ref={panelRef} role="menu" aria-label={`Semanas de ${SEGMENT_LABEL[activeSegment]}`}>
          {segmentWeeks.map((week) => {
            if (isWeekDisabled(week)) {
              return (
                <span
                  key={week.id}
                  role="menuitem"
                  aria-disabled="true"
                  className={`${styles.pickerChip} ${styles.pickerChipDisabled}`}
                >
                  {weekLabel(week)}
                </span>
              )
            }

            return (
              <Link
                key={week.id}
                to={linkTo(week.id)}
                role="menuitem"
                className={`${styles.pickerChip} ${week.id === activeWeekId ? styles.pickerChipActive : ''}`}
                onClick={() => setIsPickerOpen(false)}
              >
                {weekLabel(week)}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
