import { useAppVersionCheck } from '@/presentation/hooks/useAppVersionCheck'
import styles from './UpdateAvailableBanner.module.css'

/** Aviso flotante cuando hay un deploy nuevo en Vercel — ver useAppVersionCheck. */
export function UpdateAvailableBanner() {
  const updateAvailable = useAppVersionCheck()

  if (!updateAvailable) return null

  return (
    <div className={styles.banner} role="status">
      <span>Hay una versión nueva disponible.</span>
      <button type="button" onClick={() => window.location.reload()}>
        Actualizar
      </button>
    </div>
  )
}
