## Why

Los tres módulos de juego (Quiniela Semanal, Survivor, Playoffs) comparten la misma
base: usuarios autenticados, grupos privados con control de acceso, y un catálogo de
partidos/resultados de la NFL sobre el cual se calculan aciertos. Sin esta base no
hay dónde enganchar ningún módulo. Se propone construirla primero, como fundación
reutilizable, antes de proponer cada módulo como un change independiente.

## What Changes

- Alta de proyecto: proyecto Supabase (Postgres + Auth) y app React conectada a él.
- Sin registro público: no existe pantalla de "crear cuenta" para visitantes. Un
  único administrador de plataforma da de alta a cada usuario (correo + contraseña
  provisional, entregada fuera de la plataforma). El usuario SHALL cambiar esa
  contraseña obligatoriamente en su primer inicio de sesión.
- Login y perfil básico de usuario.
- Grupos privados: el administrador crea el grupo y genera su link/código de
  invitación; un usuario ya dado de alta se une él mismo con ese link/código; el
  administrador administra los miembros de cualquier grupo (no existe rol de owner
  por grupo).
- Catálogo de temporada NFL: equipos (32), semanas (incluye pretemporada Pre Sem. 1/2/3),
  partidos por semana, y carga/actualización manual de resultados oficiales por el
  administrador (deja el modelo abierto a una futura integración con API deportiva,
  sin implementarla en este change).
- Panel de administrador (único, a nivel de plataforma) para dar de alta usuarios,
  crear grupos, gestionar accesos y cargar resultados.
- Guardrail de producto: ninguna pantalla, campo o copy debe mencionar pagos, cobros
  de cuota o premios en efectivo (todo el manejo de dinero ocurre fuera de la app).

## Capabilities

### New Capabilities
- `auth-usuarios`: alta de usuario por el administrador (con contraseña
  provisional), cambio de contraseña obligatorio en el primer login, inicio de
  sesión y perfil básico de usuario.
- `grupos-privados`: creación de grupos por el administrador, invitación por
  link/código, unión a grupo por el usuario invitado, administración de miembros
  por el administrador.
- `catalogo-nfl`: modelo de datos de equipos, semanas (incluida pretemporada) y
  partidos de la temporada NFL.
- `carga-resultados`: carga y edición manual de resultados oficiales de partidos por
  el administrador, como fuente para el cálculo de aciertos de los módulos de juego.

### Modified Capabilities
(ninguna — es el primer change del proyecto, no hay specs existentes)

## Impact

- Afecta: creación del repo base de la app React, del proyecto Supabase (esquema de
  base de datos, políticas de Row Level Security, Supabase Auth), y del panel admin.
- Los tres módulos de juego (Quiniela Semanal, Survivor, Playoffs) dependerán de
  `auth-usuarios`, `grupos-privados` y `catalogo-nfl`/`carga-resultados` — se
  propondrán como changes separados una vez esta base esté aprobada.
- El perfil de usuario "avanzado" (historial de aciertos, % de acierto, mejor semana,
  participación por módulo) queda fuera de este change porque depende de datos que
  generan los módulos de juego; se abordará en un change posterior.
- Notificaciones de recordatorio (explícitamente opcionales en el requerimiento)
  quedan fuera de este change para no bloquear la base; se propondrán aparte.
