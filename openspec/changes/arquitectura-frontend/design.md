## Context

`base-plataforma` había decidido inicialmente llamar a Supabase directamente
desde componentes React, apoyándose en RLS como única capa de autorización. Con
3 módulos de juego que comparten reglas de negocio (bloqueo por kickoff,
resolución de empates), esa decisión deja de ser suficiente: la lógica
compartida terminaría duplicada y acoplada a Supabase, dificultando tests y
consistencia entre módulos. Este change introduce una arquitectura de capas
pragmática y actualiza esa decisión.

## Goals / Non-Goals

**Goals:**
- Definir una estructura de carpetas y capas que aísle las reglas de negocio de
  Supabase y de React.
- Definir cómo se comparten las reglas de negocio comunes entre los 3 módulos de
  juego, con tests unitarios.
- Definir un patrón simple de inyección de dependencias (sin contenedor de DI
  complejo) para conectar `core` con `infrastructure`.
- Mantener RLS como defensa en profundidad, sin duplicarla innecesariamente en
  el cliente.

**Non-Goals:**
- No se implementa Clean Architecture estricta de 4 capas (Entities/Use Cases/
  Interface Adapters/Frameworks separados) — se considera sobre-ingeniería para
  el tamaño de este proyecto.
- No se cambia el backend (sigue siendo Supabase) ni el modelo de datos ya
  definido en `base-plataforma` y en los 3 módulos.
- No se introduce un framework de gestión de estado global (Redux, etc.) — los
  casos de uso y hooks son suficientes para el volumen de estado de esta app.

## Decisions

**1. Tres capas: `core`, `infrastructure`, `presentation`**
- `core`: entidades (tipos de dominio), reglas de negocio puras (`core/rules`) y
  casos de uso (`core/use-cases`). No importa `supabase-js` ni React. Es la capa
  testeable sin infraestructura.
- `infrastructure`: adapters concretos que implementan las interfaces de
  repositorio (`ports`) definidas en `core`, usando supabase-js. Es el único
  lugar del proyecto que importa el cliente de Supabase.
- `presentation`: componentes y pantallas de React (incluye los componentes del
  sistema de diseño de `sistema-diseno-ui`). Consume casos de uso a través de
  hooks; nunca importa `infrastructure` directamente ni construye queries de
  Supabase.

Alternativa considerada: Clean Architecture estricta de 4 capas — se descarta
por el tamaño del proyecto (confirmado con el usuario): la separación entities/
use-cases/interface-adapters añade indirección sin beneficio proporcional acá.

**2. TypeScript para que los `ports` sean contratos reales**
Se adopta TypeScript en todo el frontend. Sin tipos, una interfaz de repositorio
es solo documentación; con TypeScript, el compilador garantiza que cada adapter
de `infrastructure` cumple el contrato que `core` espera. Alternativa
considerada: JavaScript + JSDoc — se descarta porque pierde la verificación en
tiempo de compilación, que es el principal beneficio de tener `ports` en primer
lugar.

**3. Casos de uso como funciones puras que reciben sus dependencias**
Un caso de uso es una función que recibe los repositorios que necesita como
parámetros (o mediante un objeto de dependencias), no una clase con estado ni un
contenedor de inyección de dependencias. Ejemplo conceptual:
`submitWeeklyPick({ pickRepository, gameRepository }, params)`. Evita el
boilerplate de un framework de DI para un proyecto de este tamaño, a la vez que
mantiene `core` desacoplado de cómo se construyen esas dependencias.

**4. Inyección simple vía Context de React**
Las implementaciones concretas de `infrastructure` se instancian una vez en la
raíz de la app y se exponen mediante un React Context. Los hooks de
`presentation` leen ese Context y se lo pasan a los casos de uso de `core`. No
se usa un framework de DI de terceros.

**5. Reglas de negocio compartidas viven en `core/rules`, con tests unitarios**
- `isPredictionLocked(game, now)`: usada por Quiniela Semanal, Survivor y
  Playoffs para bloquear una predicción una vez que el partido inició
  (`kickoff_at`, definido en `base-plataforma`).
- `resolveTiedRanking(entries)`: usada por Quiniela Semanal y Playoffs para
  reportar usuarios empatados en una posición del ranking, sin aplicar
  desempate (comportamiento ya definido en ambos specs).
- `classifyPointDifference(homeScore, awayScore)`: específica de Playoffs, pero
  vive igual en `core/rules` por ser una regla de negocio pura, aislada de la
  UI y de Supabase — incluye el caso límite de margen exactamente 6 puntos ya
  decidido en `modulo-playoffs`.
- Las reglas propias de Survivor (consumo de vidas, primera derrota, elegibilidad
  de podio) también se implementan en `core/rules`, aunque no se compartan con
  otros módulos, para mantener el mismo estándar de testeo aislado.

Estas funciones SHALL tener tests unitarios que cubran los casos límite ya
documentados en los specs de cada módulo (empate simultáneo, margen = 6,
ausencia de elección en Survivor, etc.), de forma que un cambio futuro en la
regla no rompa silenciosamente un caso ya resuelto.

**6. RLS se mantiene como última línea de defensa**
Los casos de uso pueden validar condiciones de negocio (ej. "el usuario tiene
acceso aprobado") para dar una respuesta rápida en la UI, pero esa validación no
sustituye las políticas RLS ya definidas en `base-plataforma`. Cualquier
escritura que llegue a Supabase por fuera de la app (ej. desde el dashboard de
Supabase o un cliente distinto) sigue protegida por RLS.

## Risks / Trade-offs

- [Definir un `port`/interfaz por cada repositorio añade archivos e indirección
  frente a llamar a Supabase directo] → Aceptado: el beneficio se concentra en
  los repositorios que tocan lógica compartida entre módulos (picks, resultados,
  acceso); no es necesario crear un port para cada tabla trivial de solo
  lectura si no hay reglas de negocio asociadas.
- [Adoptar TypeScript a mitad de la planeación (aunque antes de escribir
  código) puede sentirse como una carga adicional] → Bajo riesgo real: el
  proyecto todavía no tiene código de frontend escrito, es el mejor momento
  para adoptarlo.
- [Duplicar validación en `core` y en RLS puede generar mensajes de error
  inconsistentes entre "la app lo bloqueó" y "la base de datos lo rechazó"] →
  Mitigación: los casos de uso deben tratar un rechazo de Supabase/RLS como la
  fuente de verdad final y mostrar ese error si ocurre, aunque la validación de
  `core` ya haya intentado prevenirlo antes de enviar la petición.

## Migration Plan

- No aplica migración de datos. Es una decisión de organización de código que
  debe adoptarse antes de escribir la primera pantalla, para no tener que
  refactorizar `base-plataforma` después.
- Reemplaza formalmente la decisión de diseño #1 de `base-plataforma`
  ("Supabase directamente desde el cliente React con RLS como capa de
  autorización") por el patrón de capas descrito aquí; el resto de decisiones de
  `base-plataforma` (esquema de datos, RLS, `platform_admins`, etc.) no cambia.
