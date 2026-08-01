## ADDED Requirements

### Requirement: Solicitud y aprobación de acceso a la pickem de una semana puntual
El sistema SHALL permitir registrar, por cada combinación de usuario y semana, un estado de acceso a la pickem semanal (`solicitado | aprobado | rechazado`), gestionable exclusivamente por el administrador de plataforma. Este acceso es independiente por semana: el estado de una semana no afecta ni se hereda a ninguna otra semana.

#### Scenario: Usuario solicita acceso a la pickem de una semana
- **WHEN** un usuario solicita acceso a la pickem semanal de una semana puntual
- **THEN** el sistema registra el estado como "solicitado" para ese usuario y esa semana

#### Scenario: Administrador aprueba una solicitud semanal
- **WHEN** el administrador de plataforma aprueba una solicitud de acceso pendiente para una semana
- **THEN** el sistema cambia el estado a "aprobado" para ese usuario y esa semana

#### Scenario: Administrador rechaza una solicitud semanal
- **WHEN** el administrador de plataforma rechaza una solicitud de acceso pendiente para una semana
- **THEN** el sistema cambia el estado a "rechazado" para ese usuario y esa semana

#### Scenario: Acceso aprobado en una semana no se hereda a la siguiente
- **WHEN** una nueva semana queda disponible para predicción
- **THEN** el sistema no genera automáticamente ningún estado de acceso para esa semana a partir del estado de semanas anteriores; cada usuario debe solicitar acceso nuevamente

### Requirement: Corte de solicitud y aprobación en el kickoff de la semana
El sistema SHALL rechazar la creación o resolución de una solicitud de acceso semanal una vez que el partido con el kickoff más temprano de esa semana ya inició.

#### Scenario: Solicitud tardía
- **WHEN** un usuario intenta solicitar acceso a la pickem de una semana cuyo primer partido ya inició
- **THEN** el sistema rechaza la solicitud

#### Scenario: Aprobación tardía
- **WHEN** el administrador de plataforma intenta aprobar o rechazar una solicitud de una semana cuyo primer partido ya inició
- **THEN** el sistema rechaza la operación

### Requirement: Este módulo no usa el acceso genérico por módulo
El sistema SHALL NOT condicionar el registro de predicciones ni la resolución de solicitudes de la pickem semanal al estado genérico de `module_access` definido en `grupos-privados`; únicamente el acceso semanal definido en esta capability aplica a este módulo.

#### Scenario: Acceso genérico por módulo no otorga acceso semanal
- **WHEN** un usuario tiene un estado "aprobado" en el modelo genérico de acceso por módulo pero no tiene acceso semanal aprobado para la semana en curso
- **THEN** el sistema igual rechaza el registro de predicciones de ese usuario para esa semana
