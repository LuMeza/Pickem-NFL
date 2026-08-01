## 1. Esquema de datos y catálogo

- [x] 1.1 Migración: tabla `achievements` (id slug, scope, title, description, created_at), RLS de lectura pública para autenticados
- [x] 1.2 Migración: seed del catálogo v1 (9 logros: 4 Pickem, 3 Survivor, 2 generales — ver design.md decisión 1)
- [x] 1.3 Migración: tabla `user_achievements` (user_id, achievement_id, group_id nullable, unlocked_at) con índice único `(user_id, achievement_id, coalesce(group_id, ...))`
- [x] 1.4 Policy de RLS de `user_achievements`: select propio o admin (sin lectura de terceros en v1)

## 2. Evaluación y desbloqueo (`logros`)

- [x] 2.1 Función interna `_evaluate_pickem_achievements_for_group(p_group_id)` (security definer, sin grants públicos): evalúa semana perfecta, racha de 5 y liderazgo semanal. `pickem_primer_pick` se evalúa aparte, con un trigger propio sobre `weekly_picks` (no depende de ningún resultado, ver comentario en la migración)
- [x] 2.2 `_evaluate_survivor_achievements_for_group` evalúa los 3 logros de Survivor, invocada al final de `_survivor_recompute`
- [x] 2.3 Conectada `_evaluate_pickem_achievements_for_group` al trigger existente `AFTER UPDATE OF outcome ON games` (mismo trigger que ya recalcula Survivor)
- [x] 2.4 RPC `recalculate_achievements(p_group_id)` solo para `platform_admins` (plan B manual, mismo patrón que `recalculate_survivor_state`)
- [x] 2.5 Evaluación perezosa de `veterano` (antigüedad) vía `sync_my_achievements()`, disparada por el propio usuario al consultar su perfil
- [x] 2.6 Evaluación de `doble_jugador` (acceso aprobado a Pickem + al menos un pick de Survivor en el mismo grupo), dentro de `_evaluate_survivor_achievements_for_group`
- [ ] 2.7 Verificar idempotencia (`on conflict do nothing`) con datos reales en una transacción de prueba con ROLLBACK — **pendiente**: esta sesión no tuvo acceso a una base Supabase real (local ni remota) para correrlo; revisar antes de dar por cerrado el change, mismo criterio que `modulo-survivor`

## 3. Estadísticas agregadas de perfil (`perfil-estadisticas`)

- [x] 3.1 Función `profile_pickem_summary(p_user_id)`: aciertos totales y % transversal a todos los grupos del usuario (solo propio o admin)
- [x] 3.2 Puerto `AchievementsRepository` + entidades `Achievement`/`ProfileAchievement`/`ProfilePickemSummary` en `core`
- [x] 3.3 Casos de uso `listUserAchievements` y `getProfileStats`
- [x] 3.4 Adapter `SupabaseAchievementsRepository` en `infrastructure/supabase`
- [x] 3.5 Hooks de presentación `useListUserAchievements` y `useGetProfileStats`

## 4. Rediseño visual de `ProfilePage.tsx`

- [x] 4.1 Header "stat card": aciertos totales/% en `--font-mono` + label `--font-display`, sobre `.glass-surface`, junto al avatar/nombre existentes
- [x] 4.2 Componente `AchievementBadge` (patrón `TeamBadge`): desbloqueado en `--accent-gold`, bloqueado atenuado, con descripción accesible (`title` + `aria-label`)
- [x] 4.3 Grid de logros en `ProfilePage.tsx` usando `AchievementBadge`, sin romper el form de edición de nombre ni los `ActionCard` existentes
- [x] 4.4 Estados de carga/vacío del grid y del resumen de stats (catálogo cargando, error, o usuario sin picks todavía)
- [ ] 4.5 Verificar responsivo en los 3 breakpoints del sistema de diseño — implementado con el mismo patrón de `.games-grid`/`.card-grid` (2/3/4 columnas), pero **no verificado visualmente en navegador** en esta sesión (sin backend con las migraciones aplicadas ni sesión autenticada disponible)

## 5. Guardrails de producto

- [x] 5.1 Revisión de copys del catálogo y descripciones: sin menciones a dinero, premios, pago o cuota
- [x] 5.2 Confirmado que ningún logro depende de un concepto de "temporada cerrada" inexistente — todos usan señales ya existentes (`games.outcome`, `survivor_state.final_rank`, conteo de semanas regulares resueltas)
