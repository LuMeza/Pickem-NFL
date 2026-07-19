## Context

Este change agrega la primera integración con una fuente de datos externa del
proyecto. Es cross-cutting (toca el catálogo compartido `teams`/`games` de
`base-plataforma`), introduce infraestructura nueva (Edge Function programada)
y depende de un servicio de terceros no oficial — amerita decisiones técnicas
explícitas antes de specs/tasks.

## Goals / Non-Goals

**Goals:**
- Elegir y documentar la fuente de datos externa y sus limitaciones.
- Definir cómo se ejecuta la sincronización (programada y bajo demanda) sin
  introducir una dependencia dura.
- Definir el mapeo entre entidades de ESPN y las entidades internas
  (`teams`, `games`) de forma estable entre corridas.
- Garantizar que la sincronización nunca sobrescribe una carga manual
  (precedencia ya definida en `base-plataforma`).
- Definir manejo de fallas que no comprometa el resto de la app.

**Non-Goals:**
- No se implementa soporte a otros deportes ni a otras fuentes de datos en
  este change (solo NFL, solo ESPN).
- No se contrata ningún servicio de pago (SportsDataIO, MySportsFeeds,
  Highlightly quedan documentados como alternativas futuras si ESPN deja de
  funcionar, no se implementan ahora).
- No se implementa una interfaz de administración para remapear manualmente
  un equipo/partido mal identificado — si el mapeo automático falla, el admin
  sigue teniendo la carga manual como respaldo completo.

## Decisions

**1. Fuente de datos: endpoint público no oficial de ESPN**
`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
(parámetro `week`/`dates` para consultar semanas específicas). Sin API key,
sin costo. Alternativas consideradas: SportsDataIO, MySportsFeeds, Highlightly
— todas requieren registro/API key y tienen límites de cuota o son de pago
para uso sostenido; se descartan para v1 dado presupuesto cero del proyecto.
Si ESPN cambia o bloquea el endpoint, se puede migrar a cualquiera de estas
sin cambiar las specs (son detalle de infraestructura), solo el adapter.

**2. Ejecución: Edge Function + cron, más botón manual**
Una Supabase Edge Function (`sync-espn-results`) hace el fetch, el mapeo y la
escritura condicionada. Se programa vía Supabase Scheduled Functions (o
`pg_cron` invocando la función) cada 15-30 minutos durante horario de
partidos; fuera de temporada/horario de partidos no hay urgencia de
frecuencia alta. Además, el panel admin expone un botón "Sincronizar ahora"
que invoca la misma función bajo demanda (mismo patrón que
`admin-create-user` en `base-plataforma`: el frontend solo invoca la función,
nunca llama a ESPN directamente desde el cliente).

**3. Mapeo de equipos: `teams.espn_abbreviation`**
Columna nueva en `teams`, poblada una sola vez junto con el seed de equipos
(32 filas). El scoreboard de ESPN identifica equipos por `abbreviation`
(ej. `"SEA"`), estable y ya conocido de antemano — no requiere fuzzy matching
por nombre.

**4. Mapeo de partidos: `games.espn_event_id`, resuelto por semana + equipos
la primera vez**
En la primera sincronización de un partido, se busca en `games` por
`week_id` + par de `espn_abbreviation` (local/visita) y, al encontrar
coincidencia, se guarda el `id` del evento de ESPN en `games.espn_event_id`.
Sincronizaciones siguientes para ese partido hacen match directo por
`espn_event_id` (más rápido y no depende de que el mapeo semana/equipos siga
siendo único). Si no se encuentra coincidencia (partido reprogramado, semana
mal alineada), se omite ese evento y se registra el caso — no se crea un
partido nuevo automáticamente.

**5. Precedencia de la carga manual (reutiliza `result_source` de
`base-plataforma`)**
La función solo hace `UPDATE` de un partido si `result_source IS NULL OR
result_source = 'auto_sync'`. Si es `'manual'`, el partido se omite
silenciosamente (no es un error, es el comportamiento esperado). Cada
escritura de la función marca `result_source = 'auto_sync'`.

**6. Resiliencia partido por partido, no todo o nada**
La función procesa cada partido de la respuesta de ESPN de forma
independiente: si uno falla (dato inconsistente, mapeo no encontrado), se
registra el error (log de la Edge Function) y se continúa con los demás. Un
fallo total del endpoint (timeout, HTTP 5xx, cambio de formato) se captura,
se loggea, y la función termina sin lanzar ningún error hacia el panel admin
que impida seguir usando la carga manual con normalidad.

## Risks / Trade-offs

- [Endpoint no oficial puede cambiar de formato o dejar de funcionar sin
  aviso] → Mitigado por: la carga manual sigue siendo la fuente de verdad y
  está siempre disponible; el fallo de la sincronización nunca bloquea nada
  más de la app.
- [Posible rate limiting o bloqueo por uso automatizado desde el servidor] →
  Frecuencia moderada (15-30 min, no por segundo); sin compromiso de
  disponibilidad porque existe el fallback manual.
- [Mapeo por semana + equipos podría fallar si dos partidos de la misma
  semana comparten exactamente el mismo par de equipos — no ocurre en la NFL
  real, pero se documenta como supuesto] → Aceptado: es una garantía real del
  dominio (un mismo par de equipos no juega dos veces en la misma semana).
- [Guardar `espn_event_id` ata el catálogo interno a IDs de un tercero] →
  Aceptado: es nullable y no se usa para ninguna lógica de negocio fuera de
  esta sincronización; no compromete el resto del modelo de datos.

## Migration Plan

- Requiere que las migraciones de `base-plataforma` (incluida `result_source`)
  ya estén aplicadas.
- Migración aditiva: agrega `teams.espn_abbreviation` (nullable, luego
  poblada por seed) y `games.espn_event_id` (nullable). No rompe datos
  existentes.
- Rollback: deshabilitar/eliminar el cron de la Edge Function; el resto de la
  app sigue funcionando igual con carga manual. Las columnas agregadas pueden
  quedarse sin uso sin efectos secundarios si se decide revertir.
