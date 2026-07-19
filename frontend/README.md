# Quiniela NFL — frontend

App web (React + TypeScript + Vite) del proyecto Quiniela NFL.

La arquitectura, specs y tareas de este proyecto se documentan con OpenSpec en
`../openspec/`. Ver especialmente `../openspec/changes/arquitectura-frontend/`
para la organizacion en capas (`core` / `infrastructure` / `presentation`).

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de produccion (`tsc -b && vite build`)
- `npm test` — tests unitarios (Vitest)
- `npm run lint` — lint (oxlint)
- `npm run lint:arch` — valida las reglas de capas (dependency-cruiser)

## Configuracion

Copiar `.env.example` a `.env` y completar las variables de Supabase
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
