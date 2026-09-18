## Why

Algunos usuarios de Survivor olvidan registrar su pick antes de que cierre la
semana (kickoff del primer partido) y quedan eliminados sin haber tenido
intención real de perder. El administrador de la plataforma necesita poder
darles una segunda oportunidad puntual — habilitar el pick de esa semana
puntualmente para ese usuario, sin reabrir la semana para todo el grupo — y
volver a cerrarla cuando ya no haga falta.

## What Changes

- Nueva excepción de acceso a Survivor: el administrador puede habilitar, para
  un usuario y una semana puntuales, la posibilidad de registrar un pick aunque
  el partido más temprano de esa semana ya haya iniciado.
- La excepción solo levanta el bloqueo de horario. Se siguen aplicando todas
  las demás reglas: no repetir equipo ya usado en la temporada, no poder elegir
  estando eliminado, y que la semana sea de temporada regular.
- La excepción se consume sola en cuanto el usuario registra su pick para esa
  semana — no requiere que el administrador la cierre a mano en ese caso.
- El administrador puede revocar una excepción todavía no usada, cerrándola
  manualmente.
- El panel admin "Picks de usuarios" (modo "Por usuario") muestra, junto a cada
  semana sin pick del historial de Survivor de ese usuario, un botón para
  otorgar la excepción, y para revocarla mientras siga activa.
- La pantalla de pick de Survivor del usuario respeta la excepción: si tiene
  una excepción activa para la semana que está viendo, puede elegir equipo
  aunque ya haya cerrado para el resto del grupo, con un aviso de que fue
  habilitado por el administrador.

## Capabilities

### Modified Capabilities
- `prediccion-survivor`: se agrega un requerimiento de acceso excepcional
  otorgado por el administrador que permite saltar puntualmente el bloqueo de
  elección tras el inicio del partido, para un usuario y semana determinados.

## Impact

- Base de datos: nueva tabla de excepciones de pick (grupo, usuario, semana,
  quién y cuándo la otorgó) con RLS propia; se modifica la función SQL
  `can_pick_survivor_team` (supabase/migrations/20260811000006_survivor_pick_locks_at_week_kickoff.sql)
  para considerar excepciones activas.
- Backend/RLS: nuevas policies para que solo el administrador de plataforma
  pueda crear/revocar excepciones; el propio usuario puede leer si tiene una
  excepción activa para poder pintar el aviso en su pantalla de pick.
- Frontend:
  - `core/ports/SurvivorRepository.ts` y `infrastructure/supabase/SupabaseSurvivorRepository.ts`:
    nuevos métodos para otorgar, revocar y consultar excepciones.
  - Nuevos casos de uso en `core/use-cases` y hooks en `presentation/hooks`
    siguiendo el patrón ya usado por el resto de acciones admin de Survivor
    (`setAdminSurvivorPayment`, `setAdminSurvivorWithdrawal`, etc.).
  - `presentation/features/admin/AdminUserPicksPage.tsx`: botón de otorgar/revocar
    excepción en el historial de Survivor por usuario.
  - `presentation/features/survivor/SurvivorPickPage.tsx`: ignorar
    `pickWindowClosed` cuando hay una excepción activa para el usuario y la
    semana actuales, y mostrar el aviso correspondiente.
- No afecta a Pickem Semanal ni a Playoffs.
