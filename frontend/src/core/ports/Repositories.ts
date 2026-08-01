import type { AuthRepository } from './AuthRepository'
import type { GroupRepository } from './GroupRepository'
import type { ModuleAccessRepository } from './ModuleAccessRepository'
import type { WeeklyAccessRepository } from './WeeklyAccessRepository'
import type { WeeklyPickRepository } from './WeeklyPickRepository'
import type { PickemStandingsRepository } from './PickemStandingsRepository'
import type { CatalogRepository } from './CatalogRepository'
import type { ResultsRepository } from './ResultsRepository'
import type { SyncRepository } from './SyncRepository'

/** Conjunto de repositorios que la app inyecta en la raiz (ver src/main.tsx). */
export interface Repositories {
  authRepository: AuthRepository
  groupRepository: GroupRepository
  moduleAccessRepository: ModuleAccessRepository
  weeklyAccessRepository: WeeklyAccessRepository
  weeklyPickRepository: WeeklyPickRepository
  pickemStandingsRepository: PickemStandingsRepository
  catalogRepository: CatalogRepository
  resultsRepository: ResultsRepository
  syncRepository: SyncRepository
}
