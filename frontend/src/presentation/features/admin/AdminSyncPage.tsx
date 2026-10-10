import { useSyncWithEspn } from '@/presentation/hooks/useSyncWithEspn'
import { useSyncEspnRoster } from '@/presentation/hooks/useSyncEspnRoster'
import { useSyncEspnPredictions } from '@/presentation/hooks/useSyncEspnPredictions'
import { useSession } from '@/presentation/hooks/SessionContext'
import styles from './AdminSyncPage.module.css'

/** Tarea 3.3 (integracion-resultados-espn): sincronización bajo demanda de calendario + resultados desde ESPN. */
export function AdminSyncPage() {
  const { status, data, error, run } = useSyncWithEspn()
  const { status: rosterStatus, data: rosterData, error: rosterError, run: runRosterSync } = useSyncEspnRoster()
  const {
    status: predictionsStatus,
    data: predictionsData,
    error: predictionsError,
    run: runPredictionsSync,
  } = useSyncEspnPredictions()
  const { weeks, games } = useSession()

  async function handleSync() {
    try {
      await run()
      weeks.reload()
      games.reload()
    } catch {
      // el error queda reflejado via el estado del hook, ver render mas abajo
    }
  }

  return (
    <section>
      <h1 className="text-display-lg">Sincronizar con ESPN</h1>
      <p className="text-body-sm text-muted">
        Importa el calendario de la temporada y actualiza resultados desde el scoreboard público de ESPN. Nunca
        sobrescribe un resultado cargado o corregido a mano.
      </p>

      <button type="button" onClick={handleSync} disabled={status === 'pending'}>
        {status === 'pending' ? 'Sincronizando... (puede tardar hasta 1 minuto)' : 'Sincronizar ahora'}
      </button>

      {error && <p role="alert">No se pudo sincronizar: {error.message}</p>}

      {data && (
        <div className={`${styles.card} glass-surface`}>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{data.weeksProcessed}</span>
              <span className={styles.statLabel}>Semanas revisadas</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{data.gamesCreated}</span>
              <span className={styles.statLabel}>Partidos creados</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{data.resultsUpdated}</span>
              <span className={styles.statLabel}>Resultados actualizados</span>
            </div>
          </div>
          {data.errors.length > 0 && (
            <div className={styles.errorList}>
              <p>{data.errors.length} evento(s) con problemas:</p>
              <ul>
                {data.errors.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <h2 className="text-display-sm" style={{ marginTop: 32 }}>
        Plantillas
      </h2>
      <p className="text-body-sm text-muted">
        Trae la plantilla (roster) de los 32 equipos desde ESPN y reemplaza la plantilla guardada de cada uno.
      </p>

      <button type="button" onClick={() => runRosterSync()} disabled={rosterStatus === 'pending'}>
        {rosterStatus === 'pending' ? 'Sincronizando... (puede tardar hasta 2 minutos)' : 'Sincronizar plantillas'}
      </button>

      {rosterError && <p role="alert">No se pudo sincronizar la plantilla: {rosterError.message}</p>}

      {rosterData && (
        <div className={`${styles.card} glass-surface`}>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{rosterData.teamsProcessed}</span>
              <span className={styles.statLabel}>Equipos revisados</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{rosterData.playersSynced}</span>
              <span className={styles.statLabel}>Jugadores guardados</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{rosterData.injuriesMatched}</span>
              <span className={styles.statLabel}>Con designación de lesión</span>
            </div>
          </div>
          {rosterData.errors.length > 0 && (
            <div className={styles.errorList}>
              <p>{rosterData.errors.length} problema(s):</p>
              <ul>
                {rosterData.errors.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <h2 className="text-display-sm" style={{ marginTop: 32 }}>
        Pronósticos
      </h2>
      <p className="text-body-sm text-muted">
        Trae de ESPN el % de victoria y la línea de puntos de los partidos de los próximos 8 días. Un partido que ya
        arrancó conserva el último pronóstico que tenía.
      </p>

      <button
        type="button"
        onClick={() => runPredictionsSync().catch(() => {})}
        disabled={predictionsStatus === 'pending'}
      >
        {predictionsStatus === 'pending' ? 'Sincronizando...' : 'Sincronizar pronósticos'}
      </button>

      {predictionsError && <p role="alert">No se pudieron sincronizar los pronósticos: {predictionsError.message}</p>}

      {predictionsData && (
        <div className={`${styles.card} glass-surface`}>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{predictionsData.gamesConsidered}</span>
              <span className={styles.statLabel}>Partidos próximos</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{predictionsData.predictionsUpdated}</span>
              <span className={styles.statLabel}>Pronósticos actualizados</span>
            </div>
          </div>
          {predictionsData.errors.length > 0 && (
            <div className={styles.errorList}>
              <p>{predictionsData.errors.length} problema(s):</p>
              <ul>
                {predictionsData.errors.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
