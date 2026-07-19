## 1. Setup de proyecto

- [ ] 1.1 Crear proyecto en Supabase (Postgres + Auth) y guardar credenciales en `.env` (no versionado)
- [ ] 1.2 Inicializar app React (estructura de carpetas, router, cliente de Supabase configurado)
- [ ] 1.3 Configurar carpeta `supabase/migrations` versionada en el repo para el esquema SQL
- [ ] 1.4 Dar de alta manualmente al primer administrador en `platform_admins` (bootstrap inicial, fuera de la UI)

## 2. Esquema de datos base

- [ ] 2.1 Migración: tabla `profiles` (perfil básico ligado a `auth.users`: nombre visible, correo, `must_change_password` boolean default true)
- [ ] 2.2 Migración: tabla `platform_admins` (user_id con permiso administrativo total)
- [ ] 2.3 Migración: tabla `groups` (nombre, fecha de creación)
- [ ] 2.4 Migración: tabla `group_members` (group_id, user_id, fecha de unión — sin columna de rol)
- [ ] 2.5 Migración: tabla `group_invites` (group_id, código, fecha de creación, estado vigente/regenerado)
- [ ] 2.6 Migración: tabla `module_access` (group_id, user_id, módulo, estado `solicitado`/`aprobado`/`rechazado`)
- [ ] 2.7 Migración: tabla `teams` (32 equipos NFL) + seed de datos
- [ ] 2.8 Migración: tabla `weeks` (tipo `pretemporada`/`regular`/`playoffs`, número, orden cronológico) + seed de temporada
- [ ] 2.9 Migración: tabla `games` (week_id, equipo local, equipo visitante, `kickoff_at`)
- [ ] 2.10 Migración: columnas de resultado en `games` (ganador/empate, `home_score`, `away_score` nullable)

## 3. Row Level Security

- [ ] 3.1 Policies de `profiles`: cada usuario lee/edita solo su propio perfil; `platform_admins` puede leer todos
- [ ] 3.2 Policies de `groups`/`group_members`: solo miembros (y `platform_admins`) leen datos de su grupo; solo `platform_admins` crea grupos y administra miembros
- [ ] 3.3 Función RPC (SECURITY DEFINER) para unirse a un grupo con código de invitación válido, invocable por cualquier usuario autenticado
- [ ] 3.4 Policies de `group_invites`: solo `platform_admins` lee/regenera
- [ ] 3.5 Policies de `module_access`: usuario ve/crea su propia solicitud; solo `platform_admins` aprueba/rechaza y ve todas las del grupo
- [ ] 3.6 Policies de `teams`/`weeks`/`games`: lectura pública para autenticados, escritura solo para `platform_admins`
- [ ] 3.7 Pruebas manuales de aislamiento entre grupos (usuario ajeno no puede leer datos de un grupo distinto)

## 4. Autenticación (`auth-usuarios`)

- [ ] 4.1 Edge Function de alta de usuario: verifica que quien llama está en `platform_admins`, crea el usuario vía Supabase Admin API con contraseña provisional generada, crea su `profiles` con `must_change_password = true`, retorna la contraseña una sola vez
- [ ] 4.2 Panel admin: formulario de alta de usuario (correo, nombre) que muestra la contraseña provisional generada
- [ ] 4.3 Pantalla de login (correo + contraseña)
- [ ] 4.4 Pantalla obligatoria de cambio de contraseña en el primer login (bloquea navegación mientras `must_change_password = true`)
- [ ] 4.5 Pantalla de edición de perfil (nombre visible)
- [ ] 4.6 Guard de rutas: redirigir a login si no hay sesión activa; redirigir a cambio de contraseña obligatorio si aplica

## 5. Grupos privados (`grupos-privados`)

- [ ] 5.1 Panel admin: flujo de creación de grupo (formulario + generación de código de invitación inicial)
- [ ] 5.2 Panel admin: pantalla de invitación de un grupo (mostrar código/link vigente y botón "regenerar código")
- [ ] 5.3 Flujo de unión a grupo vía link/código para cualquier usuario autenticado (usa la función RPC de la tarea 3.3)
- [ ] 5.4 Panel admin: pantalla de administración de miembros (listar, remover) de cualquier grupo
- [ ] 5.5 Flujo de solicitud de acceso a un módulo (miembro solicita, queda en estado "solicitado")
- [ ] 5.6 Panel admin: pantalla de aprobación/rechazo de solicitudes de acceso a módulo

## 6. Catálogo NFL (`catalogo-nfl`)

- [ ] 6.1 Pantalla/listado de equipos (lectura)
- [ ] 6.2 Pantalla/listado de semanas de temporada, incluida pretemporada (lectura)
- [ ] 6.3 Pantalla/listado de partidos por semana (lectura)
- [ ] 6.4 Utilidad compartida para determinar si la ronda de playoffs ya inició (consulta de semana tipo playoffs vigente)

## 7. Carga de resultados (`carga-resultados`)

- [ ] 7.1 Panel admin: formulario para registrar ganador/empate y marcador exacto de un partido
- [ ] 7.2 Panel admin: edición de un resultado ya cargado
- [ ] 7.3 Restringir acceso al panel admin a usuarios en `platform_admins`
- [ ] 7.4 Vista de resultados de solo lectura para usuarios regulares (incluye caso "aún sin resultado")

## 8. Guardrails de producto

- [ ] 8.1 Revisión de copys/pantallas: verificar que ningún texto mencione pago, cobro o premio en efectivo
