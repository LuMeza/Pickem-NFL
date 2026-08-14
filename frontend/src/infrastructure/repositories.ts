import type { Repositories } from '@/core/ports'
import { supabaseClient } from '@/infrastructure/supabase/client'
import { SupabaseAchievementsRepository } from '@/infrastructure/supabase/SupabaseAchievementsRepository'
import { SupabaseAdminPicksRepository } from '@/infrastructure/supabase/SupabaseAdminPicksRepository'
import { SupabaseAuthRepository } from '@/infrastructure/supabase/SupabaseAuthRepository'
import { SupabaseGroupRepository } from '@/infrastructure/supabase/SupabaseGroupRepository'
import { SupabaseModuleAccessRepository } from '@/infrastructure/supabase/SupabaseModuleAccessRepository'
import { SupabaseWeeklyPickRepository } from '@/infrastructure/supabase/SupabaseWeeklyPickRepository'
import { SupabasePickemStandingsRepository } from '@/infrastructure/supabase/SupabasePickemStandingsRepository'
import { SupabaseSurvivorRepository } from '@/infrastructure/supabase/SupabaseSurvivorRepository'
import { SupabaseCatalogRepository } from '@/infrastructure/supabase/SupabaseCatalogRepository'
import { SupabaseResultsRepository } from '@/infrastructure/supabase/SupabaseResultsRepository'
import { SupabaseSyncRepository } from '@/infrastructure/supabase/SupabaseSyncRepository'
import { SupabaseWeeklyPicksBoardRepository } from '@/infrastructure/supabase/SupabaseWeeklyPicksBoardRepository'

/**
 * Punto único de construcción de los adapters concretos. Solo `src/main.tsx`
 * (la raiz de la app) debe importar este módulo — ver
 * openspec/changes/arquitectura-frontend design.md, decision 4.
 */
export function createSupabaseRepositories(): Repositories {
  return {
    authRepository: new SupabaseAuthRepository(supabaseClient),
    groupRepository: new SupabaseGroupRepository(supabaseClient),
    moduleAccessRepository: new SupabaseModuleAccessRepository(supabaseClient),
    weeklyPickRepository: new SupabaseWeeklyPickRepository(supabaseClient),
    pickemStandingsRepository: new SupabasePickemStandingsRepository(supabaseClient),
    survivorRepository: new SupabaseSurvivorRepository(supabaseClient),
    catalogRepository: new SupabaseCatalogRepository(supabaseClient),
    resultsRepository: new SupabaseResultsRepository(supabaseClient),
    syncRepository: new SupabaseSyncRepository(supabaseClient),
    adminPicksRepository: new SupabaseAdminPicksRepository(supabaseClient),
    achievementsRepository: new SupabaseAchievementsRepository(supabaseClient),
    weeklyPicksBoardRepository: new SupabaseWeeklyPicksBoardRepository(supabaseClient),
  }
}
