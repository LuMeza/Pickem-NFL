import { useResultsUpdated } from '@/presentation/hooks/useResultsUpdated'
import styles from './ResultsUpdatedBanner.module.css'

/** Aviso flotante cuando cambia el resultado de algún partido en el servidor — ver useResultsUpdated. */
export function ResultsUpdatedBanner() {
  const updated = useResultsUpdated()

  if (!updated) return null

  return (
    <div className={styles.banner} role="status">
      <span>Hay resultados nuevos.</span>
      <button type="button" onClick={() => window.location.reload()}>
        Actualizar
      </button>
    </div>
  )
}
