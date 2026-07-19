import { useCallback } from 'react'
import { joinGroupByInvite, type JoinGroupByInviteParams } from '@/core/use-cases/joinGroupByInvite'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Union a grupo mediante link/codigo de invitacion. */
export function useJoinGroupByInvite() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: JoinGroupByInviteParams) => joinGroupByInvite(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
