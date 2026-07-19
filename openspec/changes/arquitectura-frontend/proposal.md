## Why

Los tres módulos de juego (Quiniela Semanal, Survivor, Playoffs) comparten reglas
de negocio no triviales: bloqueo de una predicción cuando el partido ya inició,
reporte de empates sin regla de desempate (Quiniela Semanal y Playoffs), y
cálculos de aciertos a partir de resultados oficiales. Sin una arquitectura común,
cada módulo reimplementaría esa lógica por su cuenta, acoplada directamente a
Supabase dentro de los componentes de React — más difícil de testear, de mantener
consistente entre módulos, y de reutilizar. Se propone una arquitectura de 3 capas
(pragmática, no Clean Architecture estricta de 4 capas) que aplica a todos los
changes de frontend ya propuestos.

## What Changes

- Estructura de carpetas en 3 capas: `core` (entidades, reglas de dominio, casos
  de uso — sin dependencias de Supabase ni de React), `infrastructure` (adapters
  que implementan interfaces de repositorio de `core` usando supabase-js),
  `presentation` (componentes y pantallas de React).
- Ningún componente de presentación llama directamente al cliente de Supabase —
  toda lectura/escritura pasa por un caso de uso de `core`, que depende de una
  interfaz de repositorio (`port`) implementada en `infrastructure`.
- Adopción de TypeScript en el frontend, para que las interfaces de repositorio
  (`ports`) sean contratos verificados en compilación.
- Reglas de negocio compartidas entre módulos extraídas a `core/rules`, con tests
  unitarios: bloqueo de predicción por `kickoff_at`, resolución de empates
  compartidos (sin desempate automático), clasificación de resultado de Playoffs
  por rango de diferencia de puntos.
- Row Level Security (ya definida en `base-plataforma`) se mantiene como última
  línea de defensa — esta arquitectura organiza el código del cliente, no
  reemplaza la autorización a nivel de base de datos.
- Actualiza la decisión de diseño de `base-plataforma` que planteaba llamar a
  Supabase directamente desde los componentes React, para alinearla con este
  patrón de capas.

## Capabilities

### New Capabilities
- `arquitectura-capas`: organización en 3 capas (core/infrastructure/
  presentation), acceso a datos exclusivamente vía repositorios/casos de uso, y
  RLS como defensa en profundidad.
- `reglas-negocio-compartidas`: reglas de dominio reutilizadas entre los 3
  módulos de juego (bloqueo por kickoff, resolución de empates, clasificación de
  resultado de Playoffs), con cobertura de tests unitarios.

### Modified Capabilities
(ninguna — no cambia el comportamiento observable definido en `base-plataforma`
ni en los 3 módulos, solo cómo se organiza el código que lo implementa)

## Impact

- Afecta cómo se ejecutan las tareas de implementación de `base-plataforma`,
  `modulo-quiniela-semanal`, `modulo-survivor` y `modulo-playoffs`: sus pantallas
  se construyen sobre casos de uso/hooks en vez de llamar a Supabase
  directamente, y reutilizan `core/rules` en vez de reimplementar bloqueo/empates
  por módulo.
- No cambia ninguna spec funcional existente (los requirements y scenarios ya
  definidos siguen siendo el comportamiento esperado); es un change de
  arquitectura, no de producto.
- Reemplaza la decisión de diseño #1 de `base-plataforma` ("Supabase directamente
  desde el cliente React") por el patrón de capas descrito aquí.
