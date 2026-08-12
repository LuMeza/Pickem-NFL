## REMOVED Requirements

> Toda esta capability fue eliminada del producto el 2026-08-12
> (`supabase/migrations/20260812000000_remove_weekly_access_approval.sql`):
> el cobro del pozo se gestiona fuera de la plataforma, así que la
> aprobación del administrador dejó de aportar control real y era pura
> fricción para los usuarios. La tabla `weekly_access` fue eliminada por
> completo; cualquier miembro del grupo puede registrar sus picks de la
> Pickem Semanal libremente, sin solicitar ni esperar aprobación previa. La
> única restricción vigente sobre cuándo se puede predecir vive ahora en
> `prediccion-pickem-semanal` (bloqueo por bloque de días).

### Requirement: Solicitud y aprobación de acceso a la pickem de una semana puntual
**Eliminado.** Ya no existe un estado de acceso por (usuario, semana) ni una
pantalla de aprobación/rechazo para el administrador.

### Requirement: Corte de solicitud y aprobación en el kickoff de la semana
**Eliminado** junto con el requerimiento anterior — sin solicitud ni
aprobación, no hay nada que cortar en el kickoff.

### Requirement: Este módulo no usa el acceso genérico por módulo
**Eliminado.** Sigue siendo cierto que la Pickem Semanal no usa
`module_access`, pero esa afirmación ya no tiene nada que contrastar: el
módulo no aplica ningún control de acceso semanal propio tampoco.
