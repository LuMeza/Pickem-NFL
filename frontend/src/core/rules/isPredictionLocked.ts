import type { PredictionGame } from '@/core/entities/game'

/**
 * Regla compartida entre Quiniela Semanal, Survivor y Playoffs
 * (ver openspec/changes/arquitectura-frontend, decision 5 / tarea 3.1).
 * Una prediccion se bloquea en cuanto llega la hora de kickoff del partido.
 */
export function isPredictionLocked(game: PredictionGame, now: Date): boolean {
  return now.getTime() >= game.kickoffAt.getTime()
}
