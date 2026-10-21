import { useCallback, useRef, useState } from 'react'

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
  // Solo la llamada más reciente escribe el estado: si el usuario cambia de
  // semana antes de que llegue la respuesta anterior, esa respuesta vieja no
  // debe pisar a la nueva (la promesa sí se le resuelve a quien la esperaba).
  const latestCallId = useRef(0)

  const run = useCallback(
    async (params: TParams): Promise<TResult> => {
      const callId = ++latestCallId.current
      setState({ status: 'pending', data: null, error: null })
      try {
        const data = await action(params)
        if (callId === latestCallId.current) setState({ status: 'success', data, error: null })
        return data
      } catch (rawError) {
        const error = rawError instanceof Error ? rawError : new Error(String(rawError))
        if (callId === latestCallId.current) setState({ status: 'error', data: null, error })
        throw error
      }
    },
    [action],
  )

  return { ...state, run }
}
