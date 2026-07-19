## ADDED Requirements

### Requirement: Clasificación del resultado oficial en las 3 categorías de diferencia
El sistema SHALL clasificar el resultado oficial de un partido de playoffs (con marcador cargado) en una de tres categorías: `local_amplio` si el equipo local ganó por más de 6 puntos, `visita_amplio` si el equipo visitante ganó por más de 6 puntos, o `cerrado` en cualquier otro caso, incluyendo un margen de exactamente 6 puntos o un empate.

#### Scenario: Resultado con diferencia amplia a favor del local
- **WHEN** el marcador oficial de un partido de playoffs muestra al equipo local ganando por más de 6 puntos
- **THEN** el sistema clasifica el resultado como `local_amplio`

#### Scenario: Resultado con diferencia amplia a favor de la visita
- **WHEN** el marcador oficial de un partido de playoffs muestra al equipo visitante ganando por más de 6 puntos
- **THEN** el sistema clasifica el resultado como `visita_amplio`

#### Scenario: Resultado cerrado, incluido el margen exacto de 6 puntos
- **WHEN** el marcador oficial de un partido de playoffs tiene una diferencia de 6 puntos o menos, sin importar qué equipo ganó
- **THEN** el sistema clasifica el resultado como `cerrado`

### Requirement: Cálculo automático de aciertos
El sistema SHALL calcular automáticamente si la predicción de un usuario fue un acierto comparándola contra la clasificación del resultado oficial del partido, en cuanto el marcador oficial esté disponible.

#### Scenario: Predicción coincide con la clasificación oficial
- **WHEN** la predicción de un usuario para un partido de playoffs coincide con la categoría del resultado oficial clasificado
- **THEN** el sistema cuenta esa predicción como acierto

### Requirement: Tabla de resultados por ronda de playoffs
El sistema SHALL mostrar una tabla de resultados por ronda de playoffs con los aciertos de cada usuario en los partidos de esa ronda.

#### Scenario: Consultar resultados de una ronda
- **WHEN** un miembro del grupo consulta la tabla de resultados de una ronda de playoffs con marcadores ya cargados
- **THEN** el sistema muestra los aciertos de cada participante para esa ronda

### Requirement: Ranking final de temporada del módulo con podio de 3 lugares
El sistema SHALL calcular un ranking final por grupo ordenado por el total de aciertos acumulados en toda la ronda de playoffs, otorgando 1er, 2do y 3er lugar según ese total.

#### Scenario: Podio sin empates
- **WHEN** se consulta el ranking final de playoffs y los totales de aciertos de los candidatos al podio son todos distintos
- **THEN** el sistema asigna 1er, 2do y 3er lugar sin ambigüedad

### Requirement: Empate compartido en cualquier posición del podio
Cuando dos o más usuarios empatan en aciertos totales para una misma posición del podio (1er, 2do o 3er lugar), el sistema SHALL reportar a todos los usuarios empatados en esa posición, sin aplicar ninguna regla de desempate.

#### Scenario: Empate en una posición del podio
- **WHEN** dos o más usuarios comparten el mismo total de aciertos y ese total corresponde a una posición del podio
- **THEN** el sistema reporta a todos esos usuarios como empatados en esa posición
