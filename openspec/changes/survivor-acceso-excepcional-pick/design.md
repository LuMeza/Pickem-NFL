## Context

El cierre de selección de Survivor es global por semana: `public.can_pick_survivor_team`
(supabase/migrations/20260915000001_survivor_withdrawals.sql, última versión)
exige `not public.week_kickoff_started(p_week_id)`, y esa misma función respalda
las policies RLS de insert/update de `survivor_picks`
(supabase/migrations/20260731040001_survivor_rls.sql). En el frontend,
`SurvivorPickPage.tsx` calcula `pickWindowClosed = isWeekAccessLocked(games, now)`
y con eso deshabilita los equipos y oculta el flujo de selección.

El administrador de plataforma (único rol admin del producto, ver
`openspec/config.yaml`) ya tiene un panel para actuar sobre un usuario puntual
de Survivor: `AdminUserPicksPage.tsx`, modo "Por usuario", que hoy solo
muestra picks de weekly y de survivor por semana, sin acciones. El patrón ya
usado para acciones admin de Survivor por usuario (pagos, retiro del pool) es
una tabla propia por (`group_id`, `user_id`, ...), RLS "admin-only" con
`public.is_platform_admin(auth.uid())`, y escritura directa desde el frontend
vía `upsert`/`delete` sin pasar por una función `security definer` — no hace
falta romper ese patrón acá.

## Goals / Non-Goals

**Goals:**
- El administrador puede, para un usuario y una semana regular puntuales cuyo
  pick ya cerró (o el usuario aún no eligió), habilitar que ese usuario
  registre su pick igual.
- La excepción se limita a saltar el chequeo de horario; el resto de las
  reglas de `can_pick_survivor_team` (no eliminado, no retirado, semana
  regular, equipo con partido esa semana) se siguen evaluando normalmente.
- La excepción se consume sola apenas el usuario guarda su pick para esa
  semana.
- El administrador puede revocar una excepción que todavía no fue usada.
- El usuario ve, en su propia pantalla de pick, que tiene acceso excepcional
  habilitado para esa semana.

**Non-Goals:**
- No se toca la ventana de revivir con vida extra (`revivalDeadlineWeekId`) —
  es un mecanismo distinto y ya automático.
- No se permite, vía esta excepción, repetir equipo ni elegir estando
  eliminado o retirado del pool.
- No hay notificación push/email al usuario cuando se le otorga la excepción
  en esta primera versión — el aviso vive en la pantalla de pick.
- No se generaliza a Pickem Semanal ni a Playoffs.

## Decisions

### 1. Tabla `survivor_pick_exceptions`, existencia de la fila = excepción activa
`(group_id, user_id, week_id)` como primary key, más `granted_by` y
`granted_at`. No hace falta una columna de estado: otorgar es insertar la
fila, revocar (manual o automático al usar el pick) es borrarla. Mismo criterio
que `survivor_withdrawals`, pero sin columna booleana porque acá no hace falta
distinguir "existió y se revirtió" — no se necesita conservar historial de
excepciones pasadas.

**Alternativas consideradas:** columna `consumed_at`/`revoked_at` en vez de
borrar la fila, para dejar auditoría. Se descarta por ahora: ninguna otra
tabla de acciones puntuales de Survivor (payments, withdrawals) lleva
auditoría histórica, y agregarla acá sería inconsistente con el resto del
módulo sin que se haya pedido.

### 2. RLS: admin-only para escribir, dueño o admin para leer
Igual que `survivor_withdrawals`: policy `for all` con
`using/with check public.is_platform_admin(auth.uid())` cubre insert/update/delete/select
del admin. Se agrega una policy `for select` adicional
`using (user_id = auth.uid())` para que el propio usuario pueda leer si tiene
una excepción activa para la semana que está viendo (sin necesidad de una
función `security definer` intermedia).

### 3. Otorgar/revocar: upsert/delete directo desde el frontend, sin RPC
Sigue el patrón de `setAdminSurvivorPayment`/`setAdminSurvivorWithdrawal`: la
RLS ya es la barrera de seguridad, no hace falta una función intermedia.
`SupabaseSurvivorRepository` gana `grantPickException` (upsert) y
`revokePickException` (delete) y `listPickExceptionsForUser` (select por
`group_id`+`user_id`, todas las semanas).

### 4. Bypass de horario en `can_pick_survivor_team`
Se agrega a la condición existente:
```sql
and (
  not public.week_kickoff_started(p_week_id)
  or exists (
    select 1 from public.survivor_pick_exceptions ex
    where ex.group_id = p_group_id and ex.user_id = p_uid and ex.week_id = p_week_id
  )
)
```
Así la excepción solo afecta esa condición puntual; el resto de los `exists`/
`not exists` de la función (eliminado, retirado, equipo válido de la semana)
no cambian.

### 5. Auto-consumo con un trigger AFTER INSERT OR UPDATE en `survivor_picks`
Un trigger `survivor_picks_consume_pick_exception` borra la fila de
`survivor_pick_exceptions` que matchee `group_id/user_id/week_id` cada vez que
se guarda (o edita) un pick. Se prefiere un trigger de base de datos a lógica
en el frontend/caso de uso porque `savePick` ya es un `upsert` directo a la
tabla (sin pasar por un caso de uso "grueso" del lado servidor) — el trigger
garantiza el auto-cierre pase lo que pase por dónde se guarde el pick (app,
futura migración de datos, admin corrigiendo un pick a mano), en vez de
depender de que el frontend recuerde borrar la excepción después de guardar.

### 6. Frontend: exception como dato más en `SurvivorPickPage`
Se agrega `useListSurvivorPickExceptionsForUser` (o un hook puntual
`useGetSurvivorPickException` para `group+user+week`) que la pantalla de pick
consulta para su propio usuario y la semana activa. Si hay una fila, se
ignora `pickWindowClosed` (se sigue respetando `usedTeamIds`/`isEliminated`) y
se muestra un aviso: "El administrador te habilitó el pick de esta semana."

### 7. Panel admin: qué semanas ofrecer para otorgar la excepción
Hoy `AdminUserPicksPage` en modo "Por usuario" solo itera
`userSurvivorWeeksOrdered` (semanas con pick ya registrado) para el historial
de Survivor. Para poder otorgar una excepción hace falta poder ver también
semanas regulares **sin** pick. Se cambia esa sección para iterar todas las
semanas regulares del catálogo (mismo filtro `SURVIVOR_SEGMENTS` que ya usa
`WeekSelector` en este archivo) en vez de solo las que tienen pick, y por cada
semana sin pick y ya cerrada (`isWeekAccessLocked` sobre los juegos de esa
semana) se muestra el botón "Habilitar pick" o, si ya hay una excepción activa
sin usar, "Revocar acceso". Semanas sin pick pero todavía abiertas no
necesitan botón — el usuario puede elegir directo.

## Risks / Trade-offs

- [Riesgo] El admin olvida revocar una excepción y el usuario elige un equipo
  fuera de tiempo mucho después. → Mitigación: la excepción es por semana
  puntual, no reabre semanas futuras; su alcance ya es acotado incluso sin
  revocación manual.
- [Riesgo] Trigger de auto-consumo podría interferir con el recálculo o con
  cargas masivas de picks (si existieran). → Mitigación: el trigger solo borra
  una fila de `survivor_pick_exceptions` por `group_id/user_id/week_id`, no
  toca `survivor_state` ni dispara recálculo; es una operación aislada e
  idempotente (`delete ... where` no falla si no hay fila).
- [Trade-off] No hay historial de excepciones otorgadas/usadas. Si más
  adelante se pide auditoría, se puede agregar sin romper compatibilidad
  (columna `consumed_at` nullable en vez de borrar).

## Migration Plan

- Una sola migración SQL nueva: crea `survivor_pick_exceptions`, sus policies,
  el `create or replace function` de `can_pick_survivor_team` con la condición
  agregada, y el trigger de auto-consumo sobre `survivor_picks`.
- Sin cambios en `survivor_state` ni en el recálculo — no hace falta
  recalcular nada al desplegar.
- Rollback: `drop trigger`, `drop table survivor_pick_exceptions` y volver
  `can_pick_survivor_team` a la versión anterior (sin la condición de
  excepción) en una migración de reversión si hiciera falta.
