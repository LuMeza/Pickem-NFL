## 1. Base de datos

- [ ] 1.1 Nueva migración: tabla `public.survivor_pick_exceptions` (`group_id`,
      `user_id`, `week_id` como primary key compuesta, `granted_by uuid`
      referencia a `profiles`, `granted_at timestamptz default now()`), con
      `on delete cascade` en las referencias a `groups`/`profiles`/`weeks`.
- [ ] 1.2 RLS de `survivor_pick_exceptions`: policy `for all` admin-only
      (`using`/`with check public.is_platform_admin(auth.uid())`, mismo
      patrón que `survivor_withdrawals`) + policy `for select` adicional
      `using (user_id = auth.uid())` para que el propio usuario lea si tiene
      una excepción activa.
- [ ] 1.3 `create or replace function public.can_pick_survivor_team(...)`:
      agregar la condición de bypass de horario descrita en design.md
      (decisión 4), sin tocar el resto de los `exists`/`not exists`
      existentes (eliminado, retirado, equipo válido de la semana).
- [ ] 1.4 Trigger `survivor_picks_consume_pick_exception` (`after insert or
      update on public.survivor_picks`) que borra la fila de
      `survivor_pick_exceptions` que matchee `group_id/user_id/week_id` del
      pick recién guardado.
- [ ] 1.5 Verificar en Supabase local/staging: insertar una excepción a mano,
      confirmar que un pick con horario ya cerrado pasa la RLS, y que tras
      guardarlo la fila de la excepción desaparece sola.

## 2. Core — entidades, puerto y casos de uso

- [ ] 2.1 Agregar tipo `SurvivorPickException` (o similar) en
      `core/entities/survivor.ts` si hace falta representarlo en el dominio
      (weekId, grantedAt).
- [ ] 2.2 Extender `core/ports/SurvivorRepository.ts` con un método para que
      el propio usuario consulte si tiene una excepción activa para
      `group_id/user_id/week_id` (usado por `SurvivorPickPage`).
- [ ] 2.3 Extender `core/ports/AdminPicksRepository.ts` con los métodos admin:
      listar excepciones activas de un usuario (todas las semanas), otorgar
      una excepción y revocarla.
- [ ] 2.4 Nuevo caso de uso `core/use-cases/grantSurvivorPickException.ts` y
      `core/use-cases/revokeSurvivorPickException.ts` (delegan directo al
      repositorio, sin lógica extra — mismo patrón que
      `setAdminSurvivorWithdrawal.ts`, pero sin necesidad de recalcular
      estado porque esto no toca `survivor_state`).
- [ ] 2.5 Nuevo caso de uso `core/use-cases/listAdminSurvivorPickExceptionsForUser.ts`.
- [ ] 2.6 Extender (o crear) el caso de uso que ya consulta la semana de pick
      del jugador para incluir si tiene excepción activa, si conviene
      resolverlo ahí en vez de en la pantalla.

## 3. Infraestructura (Supabase)

- [ ] 3.1 `infrastructure/supabase/SupabaseSurvivorRepository.ts`: implementar
      la consulta de excepción activa propia (select directo a
      `survivor_pick_exceptions` filtrado por `group_id/user_id/week_id`,
      cubierto por la policy de select propia).
- [ ] 3.2 `infrastructure/supabase/SupabaseAdminPaymentsRepository.ts` (o el
      archivo que implemente `AdminPicksRepository`, verificar cuál es):
      implementar listar/otorgar/revocar excepciones (`upsert`/`delete`
      directos a `survivor_pick_exceptions`, sin RPC — mismo patrón que
      `setSurvivorWithdrawal`).

## 4. Hooks de presentación

- [ ] 4.1 `presentation/hooks/useGrantSurvivorPickException.ts` y
      `useRevokeSurvivorPickException.ts` (mismo patrón que
      `useSetAdminSurvivorWithdrawal.ts`).
- [ ] 4.2 `presentation/hooks/useListAdminSurvivorPickExceptionsForUser.ts`.
- [ ] 4.3 Hook (o extensión de uno existente) para que `SurvivorPickPage`
      consulte su propia excepción activa para la semana que está viendo.

## 5. Panel admin — `AdminUserPicksPage.tsx`

- [ ] 5.1 En modo "Por usuario", sección Survivor: cambiar
      `userSurvivorWeeksOrdered` para incluir todas las semanas regulares del
      catálogo (mismo filtro que `SURVIVOR_SEGMENTS`), no solo las que ya
      tienen pick registrado.
- [ ] 5.2 Cargar las excepciones activas del usuario seleccionado
      (`useListAdminSurvivorPickExceptionsForUser`) cuando cambia
      `selectedUserId`, igual que ya se cargan sus picks.
- [ ] 5.3 Por cada semana sin pick cuyo horario ya cerró
      (`isWeekAccessLocked` sobre los juegos de esa semana), mostrar botón
      "Habilitar pick" si no hay excepción activa, o "Revocar acceso" si ya
      la hay. Semanas sin pick pero todavía abiertas no muestran botón.
- [ ] 5.4 Recargar la lista de excepciones (y opcionalmente los picks del
      usuario) después de otorgar/revocar.

## 6. Pantalla de pick — `SurvivorPickPage.tsx`

- [ ] 6.1 Consultar si el usuario tiene una excepción activa para `weekId`.
- [ ] 6.2 Si hay excepción activa, ignorar `pickWindowClosed` al calcular qué
      mostrar (pero seguir respetando `isEliminated`/`usedTeamIds` sin
      cambios) y reemplazar el mensaje de "Ya cerró la selección" por un
      aviso de acceso excepcional habilitado por el administrador (seguir los
      tokens de `doc/design-system.md`, mismo estilo que el banner de
      `isRevivalWindow`).
- [ ] 6.3 Al guardar el pick exitosamente, no hace falta borrar la excepción
      a mano en el frontend — la borra el trigger de base de datos — pero sí
      refrescar cualquier estado local que dependiera de ella si aplica.

## 7. Verificación

- [ ] 7.1 Tests unitarios de las reglas de `core` que se hayan tocado (si se
      agregó lógica más allá de pasar parámetros al repositorio).
- [ ] 7.2 Probar manualmente el flujo completo en un grupo de prueba: usuario
      sin pick de una semana cerrada → admin otorga excepción → usuario ve el
      aviso y puede elegir equipo → la excepción desaparece sola → el admin
      ya no puede revocarla porque no existe.
- [ ] 7.3 Probar revocación manual antes de que el usuario elija equipo.
- [ ] 7.4 Confirmar que la excepción no permite saltarse "no repetir equipo"
      ni elegir estando eliminado o retirado.
