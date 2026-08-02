import { useCallback } from 'react'
import {
  getModuleAccessStatus,
  type GetModuleAccessStatusParams,
} from '@/core/use-cases/getModuleAccessStatus'
import type { ModuleAccessStatus } from '@/core/ports/ModuleAccessRepository'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Estado de acceso propio a un módulo (badge en RequestModuleAccessPage). */
export function useGetModuleAccessStatus() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: GetModuleAccessStatusParams) => getModuleAccessStatus(repositories, params),
    [repositories],
  )
  return useAsyncAction<GetModuleAccessStatusParams, ModuleAccessStatus | null>(action)
}
