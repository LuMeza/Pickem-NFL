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

**1. Alcance temporal: Survivor corre en cualquier semana con partidos, sin cierre
automático al llegar playoffs**
A diferencia de la Quiniela Semanal, el requerimiento no indica que Survivor se
cierre al iniciar playoffs. Un pool de eliminación puede razonablemente extenderse
hasta que quede un solo sobreviviente, lo cual puede ocurrir durante playoffs si
el grupo es grande. Decisión: Survivor permite elecciones en cualquier semana
(pretemporada, regular o playoffs) mientras el usuario siga vivo. Se documenta
como decisión explícita porque el requerimiento es ambiguo en este punto;
revisable si el usuario del producto indica lo contrario.

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

## Risks / Trade-offs

- [Procesar el estado como job/función en vez de vista puede desincronizarse si
  se corrige un resultado oficial después de procesado] → Mitigación: el proceso
  de transición SHALL ser re-ejecutable de forma idempotente para una semana dada
  (recalcula desde el estado anterior a esa semana), para poder correrlo de nuevo
  tras una corrección de resultado.
- [Ambigüedad del alcance temporal de Survivor (decisión 1) puede no coincidir
  con la expectativa real del usuario del producto] → Documentado explícitamente
  como decisión; fácil de acotar después con un requirement adicional si se pide.

## Migration Plan

- No hay datos previos de este módulo. Requiere que las migraciones de
  `base-plataforma` ya estén aplicadas.
- Rollback: eliminar `survivor_picks` y `survivor_state` y sus policies; no
  afecta a otras capabilities.
