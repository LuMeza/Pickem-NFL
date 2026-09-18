## 1. Base de datos

- [x] 1.1 Nueva migración: tabla `public.survivor_pick_exceptions` (`group_id`,
      `user_id`, `week_id` como primary key compuesta, `granted_by uuid`
      referencia a `profiles`, `granted_at timestamptz default now()`), con
      `on delete cascade` en las referencias a `groups`/`profiles`/`weeks`.
      (`granted_by` usa `default auth.uid()`, así el frontend no necesita
      pasarlo.)
- [x] 1.2 RLS de `survivor_pick_exceptions`: policy `for all` admin-only
      (`using`/`with check public.is_platform_admin(auth.uid())`, mismo
      patrón que `survivor_withdrawals`) + policy `for select` adicional
      `using (user_id = auth.uid())` para que el propio usuario lea si tiene
      una excepción activa.
- [x] 1.3 `create or replace function public.can_pick_survivor_team(...)`:
      agregar la condición de bypass de horario descrita en design.md
      (decisión 4), sin tocar el resto de los `exists`/`not exists`
      existentes (eliminado, retirado, equipo válido de la semana).
- [x] 1.4 Trigger `survivor_picks_consume_pick_exception` (`after insert or
      update on public.survivor_picks`) que borra la fila de
      `survivor_pick_exceptions` que matchee `group_id/user_id/week_id` del
      pick recién guardado.
- [x] 1.5 Migración aplicada al proyecto de producción (`pick'emNFL`,
      `ddxpspoufmdlkbuwbxpe`) con `supabase db push` — `migration list`
      confirma local=remote para `20260918000000`. Falta la prueba funcional
      end-to-end (otorgar → elegir → auto-cierre), ver 7.2.

## 2. Core — puerto y casos de uso

- [x] 2.1 No hizo falta un tipo de entidad nuevo en `core/entities/survivor.ts`:
      el único dato que viaja es `weekId`, ya cubierto por
      `AdminSurvivorPickExceptionRow` en el puerto.
- [x] 2.2 `core/ports/SurvivorRepository.ts`: agregado `hasActivePickException(groupId, userId, weekId)`.
- [x] 2.3 Los métodos admin (listar/otorgar/revocar) se agregaron a
      `core/ports/AdminPaymentsRepository.ts` en vez de `AdminPicksRepository.ts`:
      la escritura es upsert/delete directo admin-only por RLS (igual que
      `setSurvivorWithdrawal`), no una función security definer como el resto
      de `AdminPicksRepository` — mismo criterio que ya separa esos dos
      puertos en el resto del código.
- [x] 2.4 `core/use-cases/grantSurvivorPickException.ts` y
      `core/use-cases/revokeSurvivorPickException.ts`.
- [x] 2.5 `core/use-cases/listAdminSurvivorPickExceptions.ts`.
- [x] 2.6 Caso de uso propio `core/use-cases/getSurvivorPickException.ts` (no
      se extendió `getSurvivorCurrentWeek` — son datos independientes).

## 3. Infraestructura (Supabase)

- [x] 3.1 `SupabaseSurvivorRepository.ts`: `hasActivePickException` vía select directo a `survivor_pick_exceptions`.
- [x] 3.2 `SupabaseAdminPaymentsRepository.ts`: `listSurvivorPickExceptions`/`grantSurvivorPickException`/`revokeSurvivorPickException` (upsert/delete directos, sin RPC).

## 4. Hooks de presentación

- [x] 4.1 `useGrantSurvivorPickException.ts` y `useRevokeSurvivorPickException.ts`.
- [x] 4.2 `useListAdminSurvivorPickExceptions.ts`.
- [x] 4.3 `useGetSurvivorPickException.ts`, usado por `SurvivorPickPage`.

## 5. Panel admin — `AdminUserPicksPage.tsx`

- [x] 5.1 La sección Survivor de "Por usuario" ahora itera
      `survivorWeeksForUser` (todas las semanas regulares con partidos
      cargados), no solo las que ya tienen pick.
- [x] 5.2 Se cargan las excepciones activas del usuario seleccionado al
      cambiar `selectedUserId`, junto con sus picks.
- [x] 5.3 Columna "Acceso" nueva: semana sin pick y cerrada muestra el pill
      "Habilitar pick" / "Acceso habilitado" (reutiliza el mismo componente
      visual que "Pagó/Falta" y "Retirado/Activo"); semana abierta muestra
      "Abierta" sin botón; semana con pick muestra "—".
- [x] 5.4 Se recarga la lista de excepciones después de otorgar/revocar.
- [x] Rediseño adicional (pedido por el cliente): "Pickem semanal" y
      "Survivor" ahora son dos tarjetas `glass-surface` separadas, cada una
      con su propio encabezado tipo `kicker` (ícono + nombre del módulo) y un
      dato resumen en mono ("X semanas con pick" / "X/Y con pick").

## 6. Pantalla de pick — `SurvivorPickPage.tsx`

- [x] 6.1 Consulta si el usuario tiene una excepción activa para `weekId` al
      entrar y al cambiar de semana.
- [x] 6.2 Con excepción activa, `pickWindowClosed` se calcula en `false`
      (separado de `isWeekPastKickoff`, que sigue gobernando el countdown);
      se agregó un banner nuevo (mismo estilo `deadlineBanner` que el de
      `isRevivalWindow`) avisando el acceso excepcional.
- [x] 6.3 Se refresca la excepción tras guardar el pick con éxito.

## 7. Verificación

- [x] 7.1 No se agregó lógica nueva en `core/rules` (se reutilizó
      `isWeekAccessLocked` tal cual) — no hacían falta tests unitarios
      nuevos. Sí se corrió toda la suite existente (`vitest run`, 49/49) más
      `tsc -b`, `oxlint` y `depcruise` sobre los archivos tocados: todo pasa.
- [ ] 7.2 Probar manualmente el flujo completo en un grupo real, una vez
      aplicada la migración. **Pendiente** — requiere un entorno de Supabase
      desplegado.
- [ ] 7.3 Probar revocación manual antes de que el usuario elija equipo. **Pendiente**, mismo motivo que 7.2.
- [ ] 7.4 Confirmar que la excepción no permite saltarse "no repetir equipo"
      ni elegir estando eliminado o retirado. **Pendiente**, mismo motivo —
      la condición ya está en la función SQL sin tocar el resto de sus
      chequeos, pero falta la prueba end-to-end contra una base real.
