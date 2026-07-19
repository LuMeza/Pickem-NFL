## ADDED Requirements

### Requirement: Registro de resultado oficial de un partido
Un administrador de plataforma SHALL poder registrar el resultado oficial de un partido, incluyendo el equipo ganador o empate.

#### Scenario: Registrar resultado con ganador
- **WHEN** un administrador de plataforma ingresa el equipo ganador de un partido finalizado
- **THEN** el sistema guarda el resultado y lo marca como oficial

#### Scenario: Registrar resultado de empate
- **WHEN** un administrador de plataforma marca un partido como empate
- **THEN** el sistema guarda el resultado como empate

### Requirement: Registro de marcador exacto
Un administrador de plataforma SHALL poder registrar el marcador exacto (puntos del equipo local y del visitante) de un partido, además del ganador/empate.

#### Scenario: Registrar marcador
- **WHEN** un administrador de plataforma ingresa los puntos del equipo local y del visitante de un partido
- **THEN** el sistema guarda ambos marcadores asociados al partido

### Requirement: Corrección de un resultado ya cargado
Un administrador de plataforma SHALL poder editar un resultado previamente cargado para corregir errores.

#### Scenario: Editar resultado existente
- **WHEN** un administrador de plataforma modifica el ganador o el marcador de un partido que ya tenía resultado cargado
- **THEN** el sistema actualiza el resultado con los nuevos valores

### Requirement: Restricción de escritura a administradores de plataforma
El sistema SHALL restringir la carga y edición de resultados oficiales exclusivamente a usuarios registrados como administradores de plataforma.

#### Scenario: Usuario sin permiso intenta cargar un resultado
- **WHEN** un usuario autenticado que no es administrador de plataforma intenta registrar o editar un resultado
- **THEN** el sistema rechaza la operación

### Requirement: Origen del resultado y precedencia de la carga manual
El sistema SHALL registrar si el resultado de un partido fue cargado manualmente por un administrador o por una sincronización automática con una fuente externa. Un resultado marcado como cargado o corregido manualmente SHALL tener precedencia permanente: ninguna sincronización automática SHALL sobrescribirlo.

#### Scenario: Sincronización automática no sobrescribe una carga manual
- **WHEN** una sincronización automática intenta actualizar el resultado de un partido cuyo resultado ya fue cargado o corregido manualmente por un administrador
- **THEN** el sistema conserva el valor cargado manualmente y no lo modifica

#### Scenario: Carga manual siempre permitida
- **WHEN** un administrador de plataforma edita el resultado de un partido, sin importar si el valor actual vino de una sincronización automática o de otra carga manual previa
- **THEN** el sistema actualiza el resultado y lo marca como cargado manualmente

### Requirement: Lectura de resultados por cualquier usuario autenticado
Cualquier usuario autenticado SHALL poder consultar los resultados oficiales cargados, para que los módulos de juego puedan calcular aciertos.

#### Scenario: Consultar resultado de un partido
- **WHEN** un usuario autenticado solicita el resultado de un partido que ya fue cargado
- **THEN** el sistema retorna el ganador/empate y el marcador si está disponible

#### Scenario: Partido sin resultado aún
- **WHEN** un usuario autenticado solicita el resultado de un partido que todavía no se jugó o no ha sido cargado
- **THEN** el sistema indica que el resultado no está disponible, sin error
