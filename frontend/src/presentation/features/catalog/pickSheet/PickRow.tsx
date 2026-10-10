import type { CSSProperties } from 'react'
import type { Game } from '@/core/entities/catalog'
import type { GameResult } from '@/core/entities/gameResult'
import type { GamePrediction } from '@/core/entities/gamePrediction'
import type { WeeklyPickValue } from '@/core/ports/WeeklyPickRepository'
import { formatLivePeriod } from '@/core/rules/formatLivePeriod'
import { formatPredictionSpread } from '@/core/rules/formatPredictionSpread'
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
  /** Pronóstico visible para el usuario (RLS decide según el modo del grupo); null si no hay o no le toca verlo. */
  prediction: GamePrediction | null
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
 * Pronóstico bajo el renglón, con cada dato atribuido a su fuente porque no
 * siempre coinciden: la barra es el % de victoria del modelo de ESPN (FPI) y
 * el renglón de abajo es la línea de puntos de las casas de apuestas. Solo
 * informativo — no es interactivo y nunca muestra momios ni el nombre de la
 * casa de apuestas (ver specs/pronosticos-partidos).
 */
function PredictionBar({
  game,
  prediction,
  teamName,
}: {
  game: Game
  prediction: GamePrediction
  teamName: (id: string) => string
}) {
  const homePct = Math.round(prediction.homeWinPct)
  const awayPct = Math.round(prediction.awayWinPct)
  const spread = formatPredictionSpread(prediction.homeSpread)
  const homeName = nickname(teamName(game.homeTeamId))
  const awayName = nickname(teamName(game.awayTeamId))
  const favoriteId = spread ? (spread.favorite === 'home' ? game.homeTeamId : game.awayTeamId) : null

  return (
    <div className={styles.prediction}>
      <div
        className={styles.predictionModel}
        role="img"
        aria-label={`Pronóstico ESPN: ${homeName} ${homePct}%, ${awayName} ${awayPct}%`}
      >
        <div className={styles.predictionTrack} aria-hidden="true">
          <span
            className={styles.predictionFill}
            style={{ ...teamStyle(game.homeTeamId), flexGrow: prediction.homeWinPct }}
          />
          <span
            className={styles.predictionFill}
            style={{ ...teamStyle(game.awayTeamId), flexGrow: prediction.awayWinPct }}
          />
        </div>
        <div className={styles.predictionMeta} aria-hidden="true">
          <strong>{homePct}%</strong>
          <span className={styles.predictionSource}>Pronóstico ESPN</span>
          <strong>{awayPct}%</strong>
        </div>
      </div>
      {spread && (
        <p className={styles.predictionLine}>
          Línea de apuestas: <strong>{favoriteId}</strong> por {spread.points} pts
        </p>
      )}
    </div>
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
  const { game, pickedValue, result, isFinal, isLive, locked, correct, prediction } = view
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
        data-tie-result={hasResult && result!.outcome === 'tie'}
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
    const { outcome, homeScore, awayScore } = result!
    const winnerLabel = outcome === 'tie' ? 'empate' : `ganó ${outcome === 'home' ? game.homeTeamId : game.awayTeamId}`
    // Como en un marcador de TV: el puntaje del ganador fuerte, el del perdedor
    // apagado y una flecha que apunta hacia el lado ganador.
    center = (
      <span className={styles.score} aria-label={`Final ${homeScore} a ${awayScore}, ${winnerLabel}`}>
        <span className={styles.scoreLine} aria-hidden="true">
          {outcome === 'home' && <span className={styles.winCaret}>◂</span>}
          <span data-won={outcome !== 'away'}>{homeScore}</span>
          <span className={styles.scoreDash}>–</span>
          <span data-won={outcome !== 'home'}>{awayScore}</span>
          {outcome === 'away' && <span className={styles.winCaret}>▸</span>}
        </span>
        <span className={styles.finalLabel} aria-hidden="true">
          {outcome === 'tie' ? 'Empate' : 'Final'}
          {pickedValue === 'tie' && correct !== null && <ResultMark correct={correct} />}
        </span>
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
      {prediction && <PredictionBar game={game} prediction={prediction} teamName={teamName} />}
      {saveFailed && (
        <p className={`${styles.rowError} text-body-sm`} role="alert">
          No se pudo guardar tu pick. Intenta de nuevo.
        </p>
      )}
    </div>
  )
}
