import type { Repositories } from '@/core/ports'
import { supabaseClient } from '@/infrastructure/supabase/client'
import { SupabaseAuthRepository } from '@/infrastructure/supabase/SupabaseAuthRepository'
import { SupabaseGroupRepository } from '@/infrastructure/supabase/SupabaseGroupRepository'
import { SupabaseModuleAccessRepository } from '@/infrastructure/supabase/SupabaseModuleAccessRepository'
import { SupabaseWeeklyAccessRepository } from '@/infrastructure/supabase/SupabaseWeeklyAccessRepository'
import { SupabaseWeeklyPickRepository } from '@/infrastructure/supabase/SupabaseWeeklyPickRepository'
import { SupabasePickemStandingsRepository } from '@/infrastructure/supabase/SupabasePickemStandingsRepository'
import { SupabaseCatalogRepository } from '@/infrastructure/supabase/SupabaseCatalogRepository'
import { SupabaseResultsRepository } from '@/infrastructure/supabase/SupabaseResultsRepository'
import { SupabaseSyncRepository } from '@/infrastructure/supabase/SupabaseSyncRepository'

/**
 * Punto unico de construccion de los adapters concretos. Solo `src/main.tsx`
 * (la raiz de la app) debe importar este modulo — ver
 * openspec/changes/arquitectura-frontend design.md, decision 4.
 */
export function createSupabaseRepositories(): Repositories {
  return {
    authRepository: new SupabaseAuthRepository(supabaseClient),
    groupRepository: new SupabaseGroupRepository(supabaseClient),
    moduleAccessRepository: new SupabaseModuleAccessRepository(supabaseClient),
    weeklyAccessRepository: new SupabaseWeeklyAccessRepository(supabaseClient),
    weeklyPickRepository: new SupabaseWeeklyPickRepository(supabaseClient),
    pickemStandingsRepository: new SupabasePickemStandingsRepository(supabaseClient),
    catalogRepository: new SupabaseCatalogRepository(supabaseClient),
    resultsRepository: new SupabaseResultsRepository(supabaseClient),
    syncRepository: new SupabaseSyncRepository(supabaseClient),
  }
}
