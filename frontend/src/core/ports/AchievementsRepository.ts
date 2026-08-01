import type { Achievement, ProfilePickemSummary } from '@/core/entities/achievement'

/**
 * Catalogo de logros y su desbloqueo por usuario — ver
 * openspec/changes/sistema-logros-perfil specs/logros. La evaluacion real
 * (que condiciones desbloquean que logro) vive en funciones SQL SECURITY
 * DEFINER (ver design.md decisiones 1-4); este puerto solo expone catalogo,
 * ids desbloqueados propios, el disparo de la evaluacion perezosa (veterano)
 * y el resumen de aciertos para el header del perfil.
 */
export interface AchievementsRepository {
  listCatalog(): Promise<Achievement[]>
  /** Ids de logros ya desbloqueados por el usuario actual (RLS: solo propios). */
  listMyUnlockedAchievementIds(): Promise<string[]>
  /** Evalua logros generales que no dependen de un trigger de resultado (hoy: veterano). */
  syncMyAchievements(): Promise<void>
  /** Aciertos totales/partidos con resultado, transversal a todos los grupos del usuario. Solo propio o admin. */
  getProfilePickemSummary(userId: string): Promise<ProfilePickemSummary>
}
