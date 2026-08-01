## 1. Setup de proyecto

> Nota: las tareas de pantallas/flujos de este change se implementan siguiendo la
> arquitectura de 3 capas de `arquitectura-frontend` (core/infrastructure/
> presentation) — ese change debe implementarse primero o en paralelo al setup
> inicial (sección 1) de este mismo change.

- [x] 1.1 Crear proyecto en Supabase (Postgres + Auth) y guardar credenciales en `.env` (no versionado)
- [x] 1.2 Inicializar app React + TypeScript (estructura de carpetas de `arquitectura-frontend`, router, cliente de Supabase configurado dentro de `infrastructure`)
- [x] 1.3 Configurar carpeta `supabase/migrations` versionada en el repo para el esquema SQL
- [x] 1.4 Dar de alta manualmente al primer administrador en `platform_admins` (bootstrap inicial, fuera de la UI)

## 2. Esquema de datos base

- [x] 2.1 Migración: tabla `profiles` (perfil básico ligado a `auth.users`: nombre visible, correo, `must_change_password` boolean default true)
- [x] 2.2 Migración: tabla `platform_admins` (user_id con permiso administrativo total)
- [x] 2.3 Migración: tabla `groups` (nombre, fecha de creación)
- [x] 2.4 Migración: tabla `group_members` (group_id, user_id, fecha de unión — sin columna de rol)
- [x] 2.5 Migración: tabla `group_invites` (group_id, código, fecha de creación, estado vigente/regenerado)
- [x] 2.6 Migración: tabla `module_access` (group_id, user_id, módulo, estado `solicitado`/`aprobado`/`rechazado`)
- [x] 2.7 Migración: tabla `teams` (32 equipos NFL) + seed de datos
- [x] 2.8 Migración: tabla `weeks` (tipo `pretemporada`/`regular`/`playoffs`, número, orden cronológico) + seed de temporada
- [x] 2.9 Migración: tabla `games` (week_id, equipo local, equipo visitante, `kickoff_at`)
- [x] 2.10 Migración: columnas de resultado en `games` (ganador/empate, `home_score`, `away_score` nullable, `result_source` `manual`/`auto_sync` nullable)

## 3. Row Level Security

- [x] 3.1 Policies de `profiles`: cada usuario lee/edita solo su propio perfil; `platform_admins` puede leer todos
- [x] 3.2 Policies de `groups`/`group_members`: solo miembros (y `platform_admins`) leen datos de su grupo; solo `platform_admins` crea grupos y administra miembros
- [x] 3.3 Función RPC (SECURITY DEFINER) para unirse a un grupo con código de invitación válido, invocable por cualquier usuario autenticado
- [x] 3.4 Policies de `group_invites`: solo `platform_admins` lee/regenera
- [x] 3.5 Policies de `module_access`: usuario ve/crea su propia solicitud; solo `platform_admins` aprueba/rechaza y ve todas las del grupo
- [x] 3.6 Policies de `teams`/`weeks`/`games`: lectura pública para autenticados, escritura solo para `platform_admins`
- [x] 3.7 Pruebas manuales de aislamiento entre grupos (usuario ajeno no puede leer datos de un grupo distinto) — verificado end-to-end con 2 usuarios de prueba reales (creados y removidos en la sesion): lectura de `groups`/`group_members` de otro grupo devuelve vacio, `group_invites` no legible por no-admin, delete de miembro ajeno no afecta filas, y escritura en catalogo (`teams`) bloqueada para no-admin

## 4. Autenticación (`auth-usuarios`)

- [x] 4.1 Edge Function de alta de usuario: verifica que quien llama está en `platform_admins`, crea el usuario vía Supabase Admin API con contraseña provisional generada, crea su `profiles` con `must_change_password = true`, lo agrega automáticamente al único grupo de la plataforma, retorna la contraseña una sola vez
- [x] 4.2 Panel admin: formulario de alta de usuario (correo, nombre) que muestra la contraseña provisional generada
- [x] 4.3 Pantalla de login (correo + contraseña)
- [x] 4.4 Pantalla obligatoria de cambio de contraseña en el primer login (bloquea navegación mientras `must_change_password = true`)
- [x] 4.5 Pantalla de edición de perfil (nombre visible)
- [x] 4.6 Guard de rutas: redirigir a login si no hay sesión activa; redirigir a cambio de contraseña obligatorio si aplica

## 5. Grupos privados (`grupos-privados`)

> Simplificado post-implementación a grupo único global — ver specs/grupos-privados
> actualizado. 5.1-5.3 (crear grupo, invitación, unión por código) se
> eliminaron de la UI; el alta de usuario ahora agrega automáticamente al
> único grupo (ver tarea 4.1).

- [x] 5.4 Panel admin: pantalla de administración de miembros (listar, remover) del grupo unico
- [x] 5.5 Flujo de solicitud de acceso a un módulo (usuario solicita, queda en estado "solicitado", con badge de estado)
- [x] 5.6 Panel admin: pantalla de aprobación/rechazo de solicitudes de acceso a módulo

## 6. Catálogo NFL (`catalogo-nfl`)

- [x] 6.1 Pantalla/listado de equipos (lectura)
- [x] 6.2 Pantalla/listado de semanas de temporada, incluida pretemporada (lectura)
- [x] 6.3 Pantalla/listado de partidos por semana (lectura)
- [x] 6.4 Utilidad compartida para determinar si la ronda de playoffs ya inició (consulta de semana tipo playoffs vigente)
- [x] 6.5 Panel admin: formulario para agregar un partido al calendario (semana, equipo local, equipo visitante, kickoff) — faltaba en la spec original, detectado porque `carga-resultados` solo edita partidos ya existentes

## 7. Carga de resultados (`carga-resultados`)

- [x] 7.1 Panel admin: formulario para registrar ganador/empate y marcador exacto de un partido
- [x] 7.2 Panel admin: edición de un resultado ya cargado (marca `result_source = 'manual'`)
- [x] 7.3 Restringir acceso al panel admin a usuarios en `platform_admins`
- [x] 7.4 Vista de resultados de solo lectura para usuarios regulares (incluye caso "aún sin resultado")

## 8. Guardrails de producto

- [x] 8.1 Revisión de copys/pantallas: verificar que ningún texto mencione pago, cobro o premio en efectivo
