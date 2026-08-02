import type { PlayoffResultCategory } from '@/core/entities/playoffResult'

/**
 * Regla de Playoffs (ver openspec/changes/modulo-playoffs/design.md, decision 2
 * y openspec/changes/arquitectura-frontend, tarea 3.5).
 * Un margen de exactamente 6 puntos clasifica como "cerrado": el umbral
 * "amplio" requiere estrictamente más de 6 puntos.
 */
export function classifyPointDifference(homeScore: number, awayScore: number): PlayoffResultCategory {
  const margin = Math.abs(homeScore - awayScore)

  if (margin > 6 && homeScore > awayScore) return 'local_amplio'
  if (margin > 6 && awayScore > homeScore) return 'visita_amplio'
  return 'cerrado'
}
