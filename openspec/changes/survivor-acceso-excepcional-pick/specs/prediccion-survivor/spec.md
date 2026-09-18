## ADDED Requirements

### Requirement: Acceso excepcional otorgado por el administrador
El administrador de plataforma SHALL poder otorgar, para un usuario y una
semana regular puntuales, una excepción que permita registrar la elección de
equipo de esa semana aunque el partido más temprano ya haya iniciado. Esta
excepción SHALL saltar únicamente el bloqueo de horario: se siguen aplicando
las demás restricciones de elección (no repetir equipo ya usado en la
temporada, no estar eliminado, no estar retirado del pool, semana de
temporada regular, equipo con partido esa semana).

#### Scenario: Usuario con excepción activa elige equipo tras el cierre
- **WHEN** el administrador otorgó una excepción para un usuario y una semana,
  y el partido más temprano de esa semana ya inició
- **THEN** el sistema permite a ese usuario registrar su elección de equipo
  para esa semana, siempre que cumpla el resto de las restricciones de
  elección

#### Scenario: Usuario sin excepción no puede elegir tras el cierre
- **WHEN** un usuario sin excepción activa intenta elegir equipo para una
  semana cuyo partido más temprano ya inició
- **THEN** el sistema rechaza la operación

#### Scenario: La excepción no habilita repetir equipo ni elegir estando eliminado
- **WHEN** un usuario con excepción activa intenta elegir un equipo que ya usó
  en la temporada, o está eliminado o retirado del pool
- **THEN** el sistema rechaza la elección igual que lo haría sin excepción

### Requirement: Consumo automático de la excepción
El sistema SHALL desactivar automáticamente la excepción de un usuario para
una semana en cuanto ese usuario registra su elección de equipo para esa
misma semana.

#### Scenario: La excepción se cierra sola al usarla
- **WHEN** un usuario con excepción activa para una semana registra su
  elección de equipo para esa semana
- **THEN** la excepción deja de estar activa y una nueva elección posterior
  para esa misma semana ya no está permitida por esta vía

### Requirement: Revocación manual de la excepción
El administrador de plataforma SHALL poder revocar, en cualquier momento
antes de que el usuario la use, una excepción otorgada previamente.

#### Scenario: Revocar una excepción no usada
- **WHEN** el administrador revoca una excepción que un usuario todavía no usó
  para registrar su pick
- **THEN** ese usuario deja de poder elegir equipo para esa semana si el
  partido más temprano ya inició

### Requirement: Aviso de acceso excepcional al usuario
El sistema SHALL indicarle a un usuario, en su propia pantalla de elección de
Survivor, cuando tiene una excepción activa para la semana que está viendo.

#### Scenario: Usuario ve el aviso de excepción
- **WHEN** un usuario con excepción activa para la semana actual visita su
  pantalla de elección de esa semana
- **THEN** el sistema le muestra que tiene acceso excepcional habilitado por
  el administrador, en vez del mensaje de selección cerrada
