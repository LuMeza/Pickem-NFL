## Why

El perfil de usuario (`base-plataforma`, capability `auth-usuarios`) hoy solo
muestra nombre visible, correo y un form de edición: no refleja nada del juego
del usuario pese a que `modulo-pickem-semanal` y `modulo-survivor` ya generan
señal rica (aciertos, rachas, sobrevivencia, podios). El propio
`doc/design-system.md` (sección "Perfil") ya anticipa un header tipo "stat
card" y reserva `--accent-gold` exclusivamente para logros/ranking/badges de
perfil, pero nunca se implementó — hoy la pantalla se percibe plana y estática.

## What Changes

- Catálogo fijo de logros del sistema (v1, no configurable por admin/grupo)
  cubriendo Pickem Semanal, Survivor y participación general — ver lista
  concreta en `design.md`.
- Desbloqueo automático de logros derivado de datos ya existentes
  (`weekly_picks` + `games.outcome`, `survivor_state`, `profiles.created_at`,
  `weekly_access`), disparado por los mismos triggers que ya recalculan
  estado (resultado oficial de partido, recompute de Survivor) — sin cron
  nuevo.
- Resumen agregado de estadísticas del usuario (aciertos totales y % a través
  de todos sus grupos) para el header del perfil.
- Rediseño visual de `ProfilePage.tsx` siguiendo `doc/design-system.md`:
  header "stat card" con cifras en mono + label Bebas Neue, grid de badges de
  logros (desbloqueado en dorado / bloqueado atenuado), manteniendo intactos
  el form de edición de nombre y los accesos rápidos existentes.

## Capabilities

### New Capabilities
- `logros`: catálogo de logros del sistema, evaluación y desbloqueo
  automático por usuario, persistencia idempotente.
- `perfil-estadisticas`: agregación de estadísticas de juego del usuario para
  mostrar en su perfil, y visualización de sus logros (propios) en esa misma
  pantalla.

### Modified Capabilities
(ninguna — el perfil básico de `auth-usuarios` (base-plataforma) no cambia su
comportamiento, solo se le agrega contenido nuevo en la misma pantalla)

## Impact

- Requiere `base-plataforma`, `modulo-pickem-semanal` y `modulo-survivor` ya
  implementados (lo están).
- Nuevas tablas: `achievements` (catálogo) y `user_achievements`
  (desbloqueados por usuario) — detalladas en `design.md`.
- Nuevas funciones SQL de evaluación de logros y de resumen de estadísticas
  de perfil, extendiendo los triggers existentes de `games` y de
  `_survivor_recompute`.
- Cambios de frontend acotados a `ProfilePage.tsx` y componentes/hooks nuevos;
  no afecta las pantallas de Pickem Semanal ni Survivor (solo lectura de sus
  tablas).
