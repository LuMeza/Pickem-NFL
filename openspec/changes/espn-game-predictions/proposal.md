## Why

Hoy, al llenar la quiniela semanal, el usuario solo ve los dos equipos y el horario: para decidir tiene que salir de la app a buscar récords, lesiones o quién es favorito. ESPN ya publica por cada partido un "Matchup Predictor" (modelo FPI, que considera plantillas, lesiones, QB, calendario y localía) y la línea de puntos, en el mismo sitio público del que ya sincronizamos calendario, resultados, rosters y lesiones. Traerlo es poco código y le da al usuario una referencia confiable dentro de la propia hoja de picks.

## What Changes

- Nueva sincronización de pronósticos desde ESPN: por cada partido próximo (no iniciado) de la semana en curso se consulta el endpoint `summary` de ESPN y se guarda el % de victoria de local y visitante (`predictor.gameProjection`) y, si existen, el spread y el over/under.
- Nueva tabla `game_predictions`, con una columna `source` (`espn_fpi` por ahora) para que en una fase 2 convivan otras fuentes (modelo Elo propio) sin cambiar el esquema.
- El pronóstico se congela al kickoff: después ya no se sobrescribe, para conservar "lo que decía el modelo antes del partido".
- Nueva opción por grupo en la configuración del Pick'em (admin): modo de visibilidad de pronósticos `off` (default) / `after_lock` (solo después de que cierra el pick de ese partido) / `always`. La visibilidad se aplica en RLS, no solo en la UI.
- En la hoja de picks (`PickRow`) se muestra una barra de probabilidad discreta ("JAX 74% · PHI 26%") y, si existe, "Favorito por 7.5 pts". **Nunca** se muestran moneylines, casas de apuestas ni ligas a sportsbooks (fuera de alcance del producto).
- Botón "Sincronizar pronósticos" en `/admin/sync` y un cron cada 6 horas.

## Capabilities

### New Capabilities
- `pronosticos-partidos`: sincronización, almacenamiento, congelamiento y visibilidad (por grupo) de los pronósticos de victoria por partido, y su presentación en la hoja de picks de la quiniela semanal.

### Modified Capabilities
<!-- Ninguna: openspec/specs/ no tiene specs vigentes; la sincronización de resultados (integracion-resultados-espn) no cambia de comportamiento. -->

## Impact

- **Supabase**: nueva migración (`game_predictions` + RLS, columna `predictions_mode` en `pickem_settings`, cron); nueva Edge Function `sync-espn-predictions` (con `mapping.ts` + tests, mismo patrón que `sync-espn-roster`).
- **Frontend**:
  - `core`: entidad `GamePrediction`, port y caso de uso para listar pronósticos de la semana, regla `formatPredictionSpread`.
  - `infrastructure`: adapter de Supabase.
  - `presentation`: `PickRow`/`PickSheet`, `AdminPickemSettingsPage`, `AdminSyncPage`.
- **Dependencia externa**: API pública no oficial de ESPN (`site.web.api.espn.com/.../summary?event=`). Ya dependemos de ella; si falla, la quiniela funciona igual, solo que sin pronóstico.
- Sin cambios en el cálculo de puntos, tablas ni logros.
