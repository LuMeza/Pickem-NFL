import { useEffect, useState } from 'react'
import { useRepositories } from './RepositoriesContext'

/**
 * True en cuanto el resultado de algún partido cambia en el servidor (ver
 * CatalogRepository.subscribeToResultChanges) — la pestaña ya abierta se
 * queda con los datos que cargó al entrar, así que sin esto el usuario no se
 * entera de un resultado nuevo hasta refrescar a mano.
 */
export function useResultsUpdated(): boolean {
  const { catalogRepository } = useRepositories()
  const [updated, setUpdated] = useState(false)

  useEffect(() => {
    return catalogRepository.subscribeToResultChanges(() => setUpdated(true))
  }, [catalogRepository])

  return updated
}
