import { createContext, useContext } from 'react'
import type { Repositories } from '@/core/ports'

/**
 * Context de inyeccion de dependencias (ver openspec/changes/arquitectura-frontend
 * design.md, decision 4). Este archivo solo conoce las interfaces de `core/ports`
 * — el `Provider` con las implementaciones concretas se construye en `src/main.tsx`.
 */
export const RepositoriesContext = createContext<Repositories | null>(null)

export function useRepositories(): Repositories {
  const repositories = useContext(RepositoriesContext)
  if (!repositories) {
    throw new Error('useRepositories debe usarse dentro de <RepositoriesContext.Provider>')
  }
  return repositories
}
