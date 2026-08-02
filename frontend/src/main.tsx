import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RepositoriesContext } from '@/presentation/hooks/RepositoriesContext'
import { createSupabaseRepositories } from '@/infrastructure/repositories'

// Composicion (wiring) de dependencias: único lugar del proyecto que conoce
// tanto infrastructure (adapters concretos) como presentation (React).
// Ver openspec/changes/arquitectura-frontend design.md, decision 4.
const repositories = createSupabaseRepositories()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RepositoriesContext.Provider value={repositories}>
      <App />
    </RepositoriesContext.Provider>
  </StrictMode>,
)
