import { useEffect, useState } from 'react'

const CHECK_INTERVAL_MS = 5 * 60_000

async function fetchDeployedBuildId(): Promise<string | null> {
  try {
    const response = await fetch('/version.json', { cache: 'no-store' })
    if (!response.ok) return null
    const data = (await response.json()) as { buildId?: string }
    return data.buildId ?? null
  } catch {
    return null
  }
}

/**
 * Compara el build embebido en el bundle cargado (__APP_BUILD_ID__, ver
 * vite.config.ts) contra dist/version.json servido por Vercel. React no
 * tiene forma de saber que hay un deploy nuevo — la pestaña sigue corriendo
 * el JS que ya cargó — así que esto es lo que reemplaza al refresh manual.
 * Chequea cada CHECK_INTERVAL_MS y también al volver a la pestaña, que es
 * el momento más probable en que haya un deploy nuevo esperando.
 */
export function useAppVersionCheck(): boolean {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const deployedBuildId = await fetchDeployedBuildId()
      if (!cancelled && deployedBuildId && deployedBuildId !== __APP_BUILD_ID__) {
        setUpdateAvailable(true)
      }
    }

    const intervalId = setInterval(check, CHECK_INTERVAL_MS)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return updateAvailable
}
