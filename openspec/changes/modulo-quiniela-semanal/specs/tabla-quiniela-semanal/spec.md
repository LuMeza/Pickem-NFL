## ADDED Requirements

### Requirement: Cálculo automático de aciertos por semana
El sistema SHALL calcular automáticamente, para cada usuario con predicciones registradas, la cantidad de aciertos de la semana en cuanto los resultados oficiales de los partidos de esa semana estén disponibles.

#### Scenario: Resultado oficial disponible
- **WHEN** el resultado oficial de un partido queda registrado y un usuario había predicho ese partido
- **THEN** el sistema determina si la predicción del usuario fue un acierto comparándola contra el resultado oficial

### Requirement: Tabla de posiciones semanal
El sistema SHALL mostrar una tabla de posiciones por semana, ordenada por cantidad de aciertos de esa semana, para los usuarios con acceso aprobado a la quiniela semanal del grupo.

#### Scenario: Consultar tabla de una semana
- **WHEN** un usuario con acceso aprobado consulta la tabla de posiciones de una semana con resultados ya cargados
- **THEN** el sistema muestra a los participantes de esa semana ordenados de mayor a menor cantidad de aciertos

### Requirement: Tabla de posiciones acumulada de temporada
El sistema SHALL mostrar una tabla de posiciones acumulada con el total de aciertos de cada usuario a lo largo de todas las semanas jugadas de la temporada.

#### Scenario: Consultar tabla acumulada
- **WHEN** un usuario con acceso aprobado consulta la tabla acumulada de la quiniela semanal
- **THEN** el sistema muestra a cada participante con su total de aciertos acumulados, ordenados de mayor a menor

### Requirement: Visibilidad de tablas según lo definido por el admin del grupo
El sistema SHALL restringir la visibilidad de las tablas de posiciones a los usuarios con acceso aprobado, salvo que el admin del grupo habilite explícitamente su visibilidad para usuarios sin acceso aprobado.

#### Scenario: Usuario sin acceso y sin permiso de visibilidad
- **WHEN** un miembro del grupo sin acceso aprobado y sin permiso de visibilidad habilitado por el admin intenta consultar la tabla de posiciones
- **THEN** el sistema no muestra la tabla

#### Scenario: Usuario sin acceso pero con visibilidad habilitada
- **WHEN** un miembro del grupo sin acceso aprobado consulta la tabla de posiciones y el admin habilitó la visibilidad para usuarios sin acceso
- **THEN** el sistema muestra la tabla de posiciones en modo solo lectura

### Requirement: Cierre automático al iniciar playoffs
El sistema SHALL dejar de aceptar nuevas semanas de predicción para la quiniela semanal en cuanto exista una semana de tipo playoffs marcada como iniciada, y SHALL tratar la tabla acumulada en ese momento como el resultado final de temporada del módulo.

#### Scenario: Playoffs recién arrancan
- **WHEN** la primera semana de tipo playoffs queda marcada como iniciada
- **THEN** el sistema deja de generar predicciones nuevas de quiniela semanal y la tabla acumulada existente queda como resultado final

### Requirement: Determinación del ganador de temporada
El sistema SHALL determinar como ganador de la quiniela semanal al usuario o usuarios con más aciertos acumulados al momento del cierre; si dos o más usuarios empatan en el primer lugar, el sistema SHALL reportar a todos los usuarios empatados sin aplicar ninguna regla de desempate.

#### Scenario: Un solo ganador
- **WHEN** se consulta el resultado final de la quiniela semanal y un único usuario tiene el mayor total de aciertos
- **THEN** el sistema reporta a ese usuario como único ganador

#### Scenario: Empate en el primer lugar
- **WHEN** se consulta el resultado final de la quiniela semanal y dos o más usuarios comparten el mayor total de aciertos
- **THEN** el sistema reporta a todos esos usuarios como empatados en el primer lugar, sin desempatarlos
