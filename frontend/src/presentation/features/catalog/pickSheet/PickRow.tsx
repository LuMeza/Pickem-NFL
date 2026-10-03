import type { CSSProperties } from 'react'
import type { Game } from '@/core/entities/catalog'
import type { GameResult } from '@/core/entities/gameResult'
import type { WeeklyPickValue } from '@/core/ports/WeeklyPickRepository'
import { formatLivePeriod } from '@/core/rules/formatLivePeriod'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { getReadableAccent, getTeamColors } from '@/presentation/components/TeamBadge/teamColors'
import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './PickSheet.module.css'

/** Estado de un partido ya resuelto para la hoja de picks (lo comparten PickRow y PickProgress). */
export interface GamePickView {
  game: Game
  pickedValue: WeeklyPickValue | null
  result: GameResult | null
  /** Resultado oficial cargado (getGameLiveStatus === 'final'). */
  isFinal: boolean
  isLive: boolean
  /** Ya no se puede elegir: cerró su grupo de kickoff, o la semana no admite picks. */
  locked: boolean
  /** Solo con resultado oficial y pick hecho. */
  correct: boolean | null
}

/** "Washington Commanders" -> "Commanders" (mismo criterio que TeamsPage). */
function nickname(name: string): string {
  return name.split(' ').pop() ?? name
}

function teamStyle(teamId: string): CSSProperties {
  return {
    '--team-primary': getTeamColors(teamId).primary,
    '--team-accent': getReadableAccent(teamId),
  } as CSSProperties
}

function ResultMark({ correct }: { correct: boolean }) {
  return (
    <span
      className={styles.resultMark}
      data-correct={correct}
      role="img"
      aria-label={correct ? 'Acertaste' : 'Fallaste'}
    >
      {correct ? '✓' : '✕'}
    </span>
  )
}

/**
 * Un renglón de quiniela: Local · E · Visitante. Se elige tocando el lado
 * del equipo (o la E del centro para empate); el lado elegido se tiñe con
 * el color del equipo. Con resultado oficial el centro pasa a ser el
 * marcador y el pick queda marcado como acierto o fallo.
 */
export function PickRow({
  view,
  teamName,
  saveFailed,
  onPick,
}: {
  view: GamePickView
  teamName: (id: string) => string
  saveFailed: boolean
  onPick: (gameId: string, pick: WeeklyPickValue) => void
}) {
  const { game, pickedValue, result, isFinal, isLive, locked, correct } = view
  const hasResult = isFinal && result !== null
  const disabled = locked || hasResult
  const state = hasResult ? 'final' : isLive ? 'live' : locked ? 'locked' : 'open'

  function side(value: 'home' | 'away') {
    const teamId = value === 'home' ? game.homeTeamId : game.awayTeamId
    const fullName = teamName(teamId)
    const selected = pickedValue === value
    const won = hasResult && result!.outcome === value
    return (
      <button
        type="button"
        className={styles.side}
        data-side={value}
        data-selected={selected}
        data-won={won}
        aria-pressed={selected}
        aria-label={`${fullName}${value === 'home' ? ' (local)' : ' (visitante)'}`}
        disabled={disabled}
        onClick={() => onPick(game.id, value)}
        style={teamStyle(teamId)}
      >
        <TeamBadge teamId={teamId} size="sm" />
        <span className={styles.teamText}>
          <span className={styles.abbr}>
            {teamId}
            {selected && correct !== null && <ResultMark correct={correct} />}
          </span>
          <span className={styles.nick}>{nickname(fullName)}</span>
        </span>
      </button>
    )
  }

  let center
  if (hasResult) {
    center = (
      <span className={styles.score} aria-label={`Final ${result!.homeScore} a ${result!.awayScore}`}>
        {result!.homeScore}–{result!.awayScore}
        {pickedValue === 'tie' && correct !== null && <ResultMark correct={correct} />}
      </span>
    )
  } else if (isLive) {
    center = (
      <span className={styles.live}>
        <span className={styles.liveDot} aria-hidden="true" />
        {formatLivePeriod(game.livePeriod) ?? 'Vivo'}
      </span>
    )
  } else {
    center = (
      <button
        type="button"
        className={styles.tie}
        data-selected={pickedValue === 'tie'}
        aria-pressed={pickedValue === 'tie'}
        aria-label="Empate"
        title="Empate"
        disabled={disabled}
        onClick={() => onPick(game.id, 'tie')}
      >
        {locked && pickedValue !== 'tie' ? <Icon name="lock" size={13} /> : 'E'}
      </button>
    )
  }

  return (
    <div id={`game-${game.id}`} className={styles.rowWrap}>
      <div className={styles.row} data-state={state} data-picked={pickedValue !== null}>
        {side('home')}
        <div className={styles.center}>{center}</div>
        {side('away')}
      </div>
      {saveFailed && (
        <p className={`${styles.rowError} text-body-sm`} role="alert">
          No se pudo guardar tu pick. Intenta de nuevo.
        </p>
      )}
    </div>
  )
}
