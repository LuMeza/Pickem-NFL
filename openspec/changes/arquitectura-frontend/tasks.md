## 1. Setup de proyecto y capas

- [ ] 1.1 Configurar TypeScript en el proyecto React (tsconfig, integración con el build)
- [ ] 1.2 Crear estructura de carpetas: `core/{entities,rules,use-cases,ports}`, `infrastructure/supabase`, `presentation/{components,features,hooks}`
- [ ] 1.3 Configurar framework de testing unitario para `core` (ej. Vitest)
- [ ] 1.4 Configurar regla de lint (`no-restricted-imports` o equivalente) que impida importar `supabase-js` fuera de `infrastructure`

## 2. Ports y adapters

- [ ] 2.1 Definir interfaces de repositorio en `core/ports` para los agregados con lógica de negocio asociada (grupos/accesos, catálogo/resultados, predicciones por módulo)
- [ ] 2.2 Implementar los adapters correspondientes en `infrastructure/supabase`
- [ ] 2.3 Proveer las implementaciones concretas vía un React Context en la raíz de la app

## 3. Reglas de negocio compartidas (`reglas-negocio-compartidas`)

- [ ] 3.1 Implementar `isPredictionLocked(game, now)` en `core/rules`
- [ ] 3.2 Tests unitarios de `isPredictionLocked` (antes del kickoff, exactamente en el kickoff, después del kickoff)
- [ ] 3.3 Implementar `resolveTiedRanking(entries)` en `core/rules`
- [ ] 3.4 Tests unitarios de `resolveTiedRanking` (sin empate, empate en 1er lugar, empate en 2do/3er lugar)
- [ ] 3.5 Implementar `classifyPointDifference(homeScore, awayScore)` en `core/rules`, incluido el caso límite margen = 6
- [ ] 3.6 Tests unitarios de `classifyPointDifference`, incluido el caso límite margen = 6
- [ ] 3.7 Implementar las reglas de vidas de Survivor (consumo de vida, primera derrota, elegibilidad de podio) en `core/rules`
- [ ] 3.8 Tests unitarios de las reglas de Survivor, incluidos los casos límite documentados en `modulo-survivor` (empate en semana de eliminación, ausencia de elección)

## 4. Casos de uso base

- [ ] 4.1 Casos de uso de `base-plataforma`: alta de usuario, cambio de contraseña obligatorio, login, creación de grupo, unión por invitación, aprobación/rechazo de acceso a módulo, carga/edición de resultado
- [ ] 4.2 Hooks de presentación que envuelven cada caso de uso para consumo desde componentes React

## 5. Alineación con changes existentes

- [ ] 5.1 Ajustar la implementación de `base-plataforma` para construir sus pantallas sobre casos de uso/hooks en vez de llamadas directas a Supabase
- [ ] 5.2 Ajustar la implementación de `modulo-quiniela-semanal` y `modulo-playoffs` para reutilizar `resolveTiedRanking` de `core/rules` en su tabla de posiciones
- [ ] 5.3 Ajustar la implementación de `modulo-quiniela-semanal`, `modulo-survivor` y `modulo-playoffs` para reutilizar `isPredictionLocked` de `core/rules` en sus pantallas de predicción
- [ ] 5.4 Ajustar la implementación de `modulo-playoffs` para reutilizar `classifyPointDifference` de `core/rules` en su tabla de resultados
