## Context

Survivor introduce un estado secuencial por usuario (vidas, eliminación) que
depende del orden cronológico de las semanas, a diferencia de la Quiniela Semanal
donde cada semana es independiente. Esto amerita decisiones de diseño explícitas
antes de specs/tasks, en particular cómo se procesa y almacena ese estado.

## Goals / Non-Goals

**Goals:**
- Definir el modelo de datos de elecciones semanales y de estado de supervivencia
  por usuario.
- Definir cómo y cuándo se procesa la transición de estado (vivo → vida extra
  usada → eliminado) al cargarse un resultado oficial.
- Definir el alcance temporal de Survivor (¿solo temporada regular, o también
  playoffs?) ya que el requerimiento no lo restringe explícitamente como sí lo
  hace con la Quiniela Semanal.
- Definir el cálculo del podio de 3 lugares y su regla de desempate.

**Non-Goals:**
- No se define reparto de dinero entre ganadores del podio (fuera de la
  plataforma).
- No se agregan vidas extra compradas ni configurables por grupo — son fijas en 2,
  gratuitas, según el requerimiento.

## Decisions

**1. Alcance temporal: solo temporada regular**
**Actualizado (feedback de producto, previo a implementación):** se descarta
permitir elecciones en pretemporada/Hall of Fame. El survivor arranca en la
Semana 1 de temporada regular — nadie puede quedar eliminado por un partido de
exhibición. `can_pick_survivor_team` exige `weeks.type = 'regular'` y
`_survivor_recompute` solo itera semanas `regular`. Playoffs queda fuera de
alcance de v1 (no se define su tratamiento; revisable a futuro si el grupo
llega a playoffs con más de un sobreviviente).

**2. Tabla `survivor_picks` (una fila por usuario+semana)**
Columnas: `group_id`, `user_id`, `week_id`, `team_id`, `life_number` (1 = vida
original, 2 y 3 = vidas extra), timestamps. Constraint de unicidad
`(user_id, group_id, team_id)` para bloquear repetición de equipo en toda la
temporada, y `(user_id, group_id, week_id)` para una sola elección por semana.

**3. Tabla `survivor_state` (una fila por usuario, estado acumulado)**
Columnas: `group_id`, `user_id`, `current_life` (1-3), `status`
(`alive | eliminated`), `first_loss_week_id` (nullable: semana de la primera
derrota, es decir, el fin de la vida original), `eliminated_week_id` (nullable:
semana de la eliminación definitiva), `final_rank` (nullable: 1, 2 o 3 una vez
determinado). Se mantiene como estado procesado (no vista pura) porque su cálculo
depende de la secuencia cronológica de resultados semana a semana, no solo del
estado final.

**4. Procesamiento de transición de estado al cargarse resultados de una semana**
**Actualizado (feedback de producto, previo a implementación):** el disparo es
automático — un trigger de Postgres en `games` (`AFTER UPDATE OF outcome`)
llama a `_survivor_recompute` cada vez que cambia el resultado oficial de un
partido, sin importar si la carga fue manual (admin) o vía la sincronización
ESPN. Se agrega `recalculate_survivor_state` como plan B: un RPC solo para
`platform_admins` que dispara el mismo recálculo a mano, por si el trigger no
corrió (ej. resultado cargado antes de que existiera el trigger, o corrección
posterior). Ambos invocan la misma función interna (`_survivor_recompute`, sin
grants públicos) — un solo camino de cálculo, sin lógica duplicada.

Cuando el resultado oficial de los partidos de una semana está disponible, un
proceso (Edge Function o job) recorre los `survivor_picks` de esa semana para los
usuarios `alive` y:
- Si el equipo elegido ganó: el usuario sigue `alive` en su `current_life`.
- Si el equipo elegido perdió o empató: se registra el fin de esa vida.
  - Si `current_life` era 1 (original), se guarda `first_loss_week_id` = esa
    semana.
  - Si quedan vidas extra disponibles (`current_life` < 3), se incrementa
    `current_life` y el usuario sigue `alive` para la siguiente semana.
  - Si no quedan vidas extra (`current_life` = 3 y también perdió), el usuario
    pasa a `status = eliminated` con `eliminated_week_id` = esa semana.
- Un usuario que no registró elección para la semana mientras seguía `alive` se
  trata igual que una derrota (consume vida/elimina), para no dejar "huecos" sin
  definir en el estado.

**5. Podio y desempate por `eliminated_week_id` + `first_loss_week_id`**
El último usuario `alive` cuando ya no quedan más semanas jugables obtiene el 1er
lugar. Los demás lugares del podio (2do, 3er) se asignan por orden descendente de
`eliminated_week_id` (quien cayó más tarde queda mejor posicionado). Si dos o más
usuarios comparten `eliminated_week_id` para una misma posición del podio, se
desempata por `first_loss_week_id` más alto (duró más con su vida original); si
también empatan en eso (o ambos tienen `first_loss_week_id` nulo por no haber
perdido nunca su vida original), el empate se reporta tal cual, sin forzar una
resolución.

**6. Pantalla de estado (tarea 3.4) muestra estado vigente, no historial semana
por semana**
`survivor_state` solo guarda `first_loss_week_id` (primera derrota) y
`eliminated_week_id` (derrota final) — no una fila por cada transición
intermedia (ej. la semana exacta en la que se consumió la *segunda* vida
extra, entre la primera derrota y la eliminación). Guardar cada transición
habría requerido una tabla de historial adicional no contemplada en el modelo
original. La pantalla de estado (`SurvivorStandingsPage`) muestra el estado
*actual* de cada participante (vivo con su vida vigente, o eliminado y en qué
semana) en vez de permitir "rebobinar" a ver el estado exacto de una semana
pasada cualquiera — cubre el requerimiento ("el sistema muestra el estado de
cada participante") sin ese detalle histórico intermedio.

**7. Vidas extra por solicitud, no automaticas**
**Actualizado (feedback de producto, post-implementacion — probando el
modulo ya en produccion):** la decision 4 original otorgaba las 2 vidas
extra automaticamente al perder. Se cambia: cada vida extra es opcional y
debe pedirse una por vez (primero la 2, recien despues de perder con esa
puede pedirse la 3). Nueva tabla `survivor_life_requests` (mismo patron de
solicitud/aprobacion que `weekly_access` de modulo-pickem-semanal) con
estados `solicitado/aprobado/rechazado`. `_survivor_recompute`, al detectar
una derrota con `current_life < 3`, ya no incrementa solo: consulta
`survivor_life_requests` para `life_number = current_life + 1` —
- sin fila → `status = 'needs_life_request'` (no puede pickear hasta pedir)
- `'solicitado'` → `status = 'life_request_pending'` (puede seguir
  pickeando, provisorio — confirmado con el usuario: si el admin rechaza
  despues, esos picks posteriores no cuentan porque ya estaba eliminado
  desde la semana de la derrota original)
- `'aprobado'` → `current_life += 1`, sigue `alive`
- `'rechazado'` → `status = 'eliminated'` en la semana de la derrota
  original (no la semana de la decision del admin)

`can_pick_survivor_team` se actualiza acorde (bloquea solo en
`needs_life_request`/`eliminated`). Un nuevo trigger en
`survivor_life_requests` (`after insert or update of status`) dispara el
mismo `_survivor_recompute`, igual que el trigger de `games` — un solo
camino de calculo, sin logica duplicada (mismo criterio que la decision 4
original).

**8. Bloqueo de navegacion a semanas futuras**
**Actualizado (feedback de producto, post-implementacion):** antes se podia
navegar y elegir equipo en cualquier semana regular, incluidas futuras,
antes de saber si el usuario seguia vivo para entonces — riesgo de "usar"
un equipo en una semana que quizas nunca se juega. Nueva funcion
`survivor_current_week_number()`: primera semana regular no resuelta del
todo (mismo criterio de corte que ya usa el loop de `_survivor_recompute`).
`can_pick_survivor_team` exige que la semana elegida no sea posterior a esa.
En el frontend, `WeekSelector` recibe un nuevo prop opcional
`isWeekDisabled` (no rompe los usos existentes en pickem/catalogo) para
deshabilitar la navegacion a semanas futuras en la pantalla de Survivor.

## Risks / Trade-offs

- [Procesar el estado como job/función en vez de vista puede desincronizarse si
  se corrige un resultado oficial después de procesado] → Mitigación: el proceso
  de transición SHALL ser re-ejecutable de forma idempotente para una semana dada
  (recalcula desde el estado anterior a esa semana), para poder correrlo de nuevo
  tras una corrección de resultado. **Implementado (previo a implementación de UI):**
  en vez de reanudar desde un checkpoint, `_survivor_recompute` recalcula el grupo
  entero desde la semana 1 en cada corrida (borra y reinserta `survivor_state`).
  Simplifica la lógica (sin estado intermedio que pueda desincronizarse) y es
  barato al volumen esperado (grupos privados chicos, ~18 semanas); verificado
  con datos reales del catálogo en una transacción de prueba con ROLLBACK.
- [Ambigüedad del alcance temporal de Survivor (decisión 1) puede no coincidir
  con la expectativa real del usuario del producto] → Documentado explícitamente
  como decisión; fácil de acotar después con un requirement adicional si se pide.

## Migration Plan

- No hay datos previos de este módulo. Requiere que las migraciones de
  `base-plataforma` ya estén aplicadas.
- Rollback: eliminar `survivor_picks` y `survivor_state` y sus policies; no
  afecta a otras capabilities.
