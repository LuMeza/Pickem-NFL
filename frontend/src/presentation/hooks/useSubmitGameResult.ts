import { useCallback } from 'react'
import { submitGameResult } from '@/core/use-cases/submitGameResult'
import type { ManualGameResult } from '@/core/entities/gameResult'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: carga/edición de resultado oficial de un partido. */
export function useSubmitGameResult() {
  const repositories = useRepositories()
  const action = useCallback(
    (result: ManualGameResult) => submitGameResult(repositories, result),
    [repositories],
  )
  return useAsyncAction(action)
}
