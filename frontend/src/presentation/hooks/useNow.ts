import { useEffect, useState } from 'react'

const DEFAULT_REFRESH_MS = 30_000

/** Refresca cada refreshMs para recalcular bloqueo/urgencia/estado en vivo sin un timer por tarjeta. */
export function useNow(refreshMs: number = DEFAULT_REFRESH_MS): number {
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const intervalId = setInterval(() => setNowMs(Date.now()), refreshMs)
    return () => clearInterval(intervalId)
  }, [refreshMs])
  return nowMs
}
