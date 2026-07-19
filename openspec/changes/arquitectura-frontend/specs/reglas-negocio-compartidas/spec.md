## ADDED Requirements

### Requirement: Regla compartida de bloqueo de predicción por inicio de partido
El sistema SHALL implementar una única función de dominio que determina si una predicción está bloqueada según la hora de inicio (`kickoff_at`) del partido correspondiente, y esa función SHALL ser la que usan los módulos de Quiniela Semanal, Survivor y Playoffs, en vez de que cada módulo implemente su propia verificación.

#### Scenario: Cambiar el criterio de bloqueo afecta a los 3 módulos
- **WHEN** se modifica la función compartida de bloqueo por inicio de partido
- **THEN** los tres módulos de juego reflejan ese cambio de forma consistente, sin necesidad de modificar cada uno por separado

### Requirement: Regla compartida de resolución de empates sin desempate
El sistema SHALL implementar una única función de dominio que, dada una lista de participantes con sus totales, determina los usuarios empatados en una posición de ranking sin aplicar ninguna regla de desempate, y esa función SHALL ser la que usan Quiniela Semanal y Playoffs para reportar sus respectivos empates.

#### Scenario: Ambos módulos reportan empates de forma consistente
- **WHEN** Quiniela Semanal y Playoffs necesitan reportar un empate en una posición de su ranking
- **THEN** ambos usan la misma función de dominio y producen un reporte de empate con la misma forma

### Requirement: Regla de clasificación de resultado de Playoffs
El sistema SHALL implementar una única función de dominio que clasifica el resultado oficial de un partido de Playoffs en las tres categorías definidas (local amplio, cerrado, visita amplio), incluyendo el caso límite de margen exactamente igual a 6 puntos según lo definido en el spec de Playoffs.

#### Scenario: Margen exacto de 6 puntos
- **WHEN** se clasifica un resultado oficial cuyo margen de puntos es exactamente 6
- **THEN** la función de dominio lo clasifica como "cerrado", de forma consistente con el spec de `modulo-playoffs`

### Requirement: Cobertura de tests unitarios en reglas de dominio compartidas
Toda función de `core/rules` que implemente una regla de negocio con impacto en el resultado de un módulo (bloqueo de predicción, resolución de empates, clasificación de resultado, consumo de vidas de Survivor) SHALL tener tests unitarios que cubran al menos los casos límite documentados en los specs de los módulos correspondientes.

#### Scenario: Cambio que rompe un caso límite ya cubierto
- **WHEN** un cambio en una función de `core/rules` modifica el comportamiento de un caso límite ya cubierto por un test unitario existente
- **THEN** la suite de tests unitarios falla, señalando la regresión antes de integrarse
