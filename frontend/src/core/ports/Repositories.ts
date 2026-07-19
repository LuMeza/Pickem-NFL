import type { AuthRepository } from './AuthRepository'
import type { GroupRepository } from './GroupRepository'
import type { ModuleAccessRepository } from './ModuleAccessRepository'
import type { CatalogRepository } from './CatalogRepository'
import type { ResultsRepository } from './ResultsRepository'

/** Conjunto de repositorios que la app inyecta en la raiz (ver src/main.tsx). */
export interface Repositories {
  authRepository: AuthRepository
  groupRepository: GroupRepository
  moduleAccessRepository: ModuleAccessRepository
  catalogRepository: CatalogRepository
  resultsRepository: ResultsRepository
}
