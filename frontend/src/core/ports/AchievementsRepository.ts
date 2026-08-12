import type { Achievement, ProfilePickemSummary, ProfileWeeklyTrendPoint } from '@/core/entities/achievement'

/**
 * Catálogo de logros y su desbloqueo por usuario — ver
 * openspec/changes/sistema-logros-perfil specs/logros. La evaluación real
 * (que condiciones desbloquean que logro) vive en funciones SQL SECURITY
 * DEFINER (ver design.md decisiones 1-4); este puerto solo expone catálogo,
 * ids desbloqueados propios y el resumen de aciertos para el header del
 * perfil.
 */
export interface AchievementsRepository {
  listCatalog(): Promise<Achievement[]>
  /** Ids de logros ya desbloqueados por el usuario actual (RLS: solo propios). */
  listMyUnlockedAchievementIds(): Promise<string[]>
  /** Aciertos totales/partidos con resultado, transversal a todos los grupos del usuario. Solo propio o admin. */
  getProfilePickemSummary(userId: string): Promise<ProfilePickemSummary>
  /** Aciertos por semana (ultimas semanas con datos), para el grafico de tendencia del perfil. Solo propio o admin. */
  getProfileWeeklyTrend(userId: string): Promise<ProfileWeeklyTrendPoint[]>
}
