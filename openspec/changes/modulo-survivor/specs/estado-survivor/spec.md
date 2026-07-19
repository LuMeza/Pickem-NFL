## ADDED Requirements

### Requirement: Vida original y vidas extra
El sistema SHALL otorgar a cada usuario una vida original y hasta 2 vidas extra gratuitas y limitadas por el sistema, sin costo ni compra, para continuar en el survivor tras perder con su equipo elegido.

#### Scenario: Uso automático de vida extra
- **WHEN** el equipo elegido por un usuario en una semana pierde o empata y el usuario todavía tiene vidas extra disponibles
- **THEN** el sistema consume una vida extra y mantiene al usuario con estado "vivo" para la siguiente semana

### Requirement: Eliminación definitiva al agotar las vidas
El sistema SHALL marcar a un usuario como "eliminado" cuando pierda o empate con su equipo elegido y ya no le queden vidas extra disponibles.

#### Scenario: Eliminación tras agotar vidas
- **WHEN** el equipo elegido por un usuario pierde o empata y el usuario ya usó sus 2 vidas extra
- **THEN** el sistema marca al usuario como "eliminado" y registra la semana de eliminación

### Requirement: Ausencia de elección equivale a derrota
El sistema SHALL tratar la falta de una elección de equipo de un usuario vivo en una semana con partidos disponibles de la misma forma que una derrota, para efectos de consumo de vidas y eliminación.

#### Scenario: Usuario vivo sin elección registrada
- **WHEN** llega el resultado oficial de la semana y un usuario vivo no registró ninguna elección de equipo para esa semana
- **THEN** el sistema procesa esa semana como una derrota para ese usuario, consumiendo una vida o eliminándolo según corresponda

### Requirement: Estado consultable por usuario y semana
El sistema SHALL permitir consultar el estado de cada usuario (vivo, vida extra usada, eliminado) por semana.

#### Scenario: Consultar estado de la semana
- **WHEN** un miembro del grupo consulta el estado del survivor de una semana con resultados ya procesados
- **THEN** el sistema muestra el estado de cada participante para esa semana

### Requirement: Ranking de supervivencia con podio de 3 lugares
El sistema SHALL calcular un ranking de supervivencia por grupo, otorgando el 1er lugar al último usuario que permanece "vivo", y el 2do y 3er lugar según el orden en que los demás usuarios quedaron eliminados definitivamente (quien fue eliminado después queda mejor posicionado).

#### Scenario: Podio sin empates
- **WHEN** se consulta el ranking de supervivencia y las semanas de eliminación de los usuarios candidatos al podio son todas distintas
- **THEN** el sistema asigna 1er, 2do y 3er lugar sin ambigüedad según el orden de eliminación

### Requirement: Desempate por duración con vida original
Cuando dos o más usuarios comparten la misma semana de eliminación definitiva y compiten por una misma posición del podio, el sistema SHALL desempatar a favor de quien haya durado más semanas con su vida original (antes de usar cualquier vida extra), sin importar cuánto duraron después de usar vidas extra.

#### Scenario: Empate en semana de eliminación
- **WHEN** dos usuarios quedan eliminados definitivamente en la misma semana y compiten por la misma posición del podio
- **THEN** el sistema ubica en mejor posición al usuario que sobrevivió más semanas con su vida original antes de su primera derrota

#### Scenario: Empate persiste tras aplicar el desempate
- **WHEN** dos usuarios eliminados en la misma semana también coinciden en la duración de su vida original (incluyendo el caso de que ninguno haya perdido nunca su vida original)
- **THEN** el sistema reporta a ambos usuarios empatados en esa posición del podio, sin forzar una resolución adicional
