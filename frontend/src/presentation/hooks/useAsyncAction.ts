import { useCallback, useState } from 'react'

export interface AsyncActionState<TResult> {
  status: 'idle' | 'pending' | 'success' | 'error'
  data: TResult | null
  error: Error | null
}

/**
 * Estado pending/success/error compartido por todos los hooks que envuelven
 * un caso de uso — evita reimplementar el mismo manejo en cada hook
 * (ver openspec/changes/arquitectura-frontend, tarea 4.2).
 */
export function useAsyncAction<TParams, TResult>(action: (params: TParams) => Promise<TResult>) {
  const [state, setState] = useState<AsyncActionState<TResult>>({ status: 'idle', data: null, error: null })

  const run = useCallback(
    async (params: TParams): Promise<TResult> => {
      setState({ status: 'pending', data: null, error: null })
      try {
        const data = await action(params)
        setState({ status: 'success', data, error: null })
        return data
      } catch (rawError) {
        const error = rawError instanceof Error ? rawError : new Error(String(rawError))
        setState({ status: 'error', data: null, error })
        throw error
      }
    },
    [action],
  )

  return { ...state, run }
}
