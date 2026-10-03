import type {
  Achievement,
  ProfilePickemSummary,
  ProfileWeeklyTrendPoint,
  UnlockedAchievement,
} from '@/core/entities/achievement'

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
  /**
   * Logros desbloqueados de `userId`. Hay que filtrar explícito: la RLS deja
   * a un admin leer las filas de todos, así que sin filtro su perfil mostraba
   * los logros de todo el grupo como propios.
   */
  listUnlockedAchievements(userId: string): Promise<UnlockedAchievement[]>
  /** Aciertos totales/partidos con resultado, transversal a todos los grupos del usuario. Solo propio o admin. */
  getProfilePickemSummary(userId: string): Promise<ProfilePickemSummary>
  /** Aciertos por semana (todas las semanas con resultado), para el riel de temporada del perfil. */
  getProfileWeeklyTrend(userId: string): Promise<ProfileWeeklyTrendPoint[]>
}
