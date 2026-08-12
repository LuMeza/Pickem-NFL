import { useEffect } from 'react'
import { useAppVersionCheck } from '@/presentation/hooks/useAppVersionCheck'

/** Sin UI: si detecta un deploy nuevo en Vercel, recarga la pestaña sola — ver useAppVersionCheck. */
export function AppVersionWatcher() {
  const updateAvailable = useAppVersionCheck()

  useEffect(() => {
    if (updateAvailable) window.location.reload()
  }, [updateAvailable])

  return null
}
