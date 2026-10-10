## ADDED Requirements

### Requirement: Sincronización de pronósticos desde ESPN
El sistema SHALL obtener, para cada partido aún no iniciado cuyo kickoff esté dentro de los próximos 8 días, el porcentaje de victoria de local y visitante del "Matchup Predictor" de ESPN, y SHALL guardarlo con la fuente `espn_fpi` y la fecha de obtención. Si ESPN publica spread y over/under para ese partido, el sistema SHALL guardarlos también.

#### Scenario: Partido próximo con predictor disponible
- **WHEN** la sincronización procesa un partido no iniciado, con kickoff dentro de 8 días, y ESPN devuelve `predictor.homeTeam.gameProjection` y `predictor.awayTeam.gameProjection`
- **THEN** el sistema guarda (o actualiza) el pronóstico `espn_fpi` de ese partido con ambos porcentajes y la fecha de obtención

#### Scenario: ESPN no publica predictor para el partido
- **WHEN** ESPN no devuelve el bloque `predictor` o sus porcentajes no son numéricos
- **THEN** el sistema no crea ni modifica el pronóstico de ese partido y lo reporta en el resumen de la corrida sin fallar el resto

#### Scenario: Partido sin línea de puntos
- **WHEN** ESPN devuelve el predictor pero no devuelve spread ni over/under
- **THEN** el sistema guarda los porcentajes y deja el spread y el over/under vacíos

#### Scenario: Partido lejano o ya terminado
- **WHEN** un partido tiene kickoff a más de 8 días o ya tiene resultado
- **THEN** la sincronización no consulta ESPN para ese partido

### Requirement: Congelamiento del pronóstico al kickoff
El sistema SHALL NOT modificar el pronóstico de un partido después de su kickoff, para conservar el último pronóstico previo al partido.

#### Scenario: Sincronización después del kickoff
- **WHEN** la sincronización corre y el kickoff de un partido ya pasó
- **THEN** el pronóstico guardado de ese partido queda sin cambios

### Requirement: Sincronización periódica y manual de pronósticos
El sistema SHALL sincronizar los pronósticos periódicamente durante la temporada, y el administrador de plataforma SHALL poder dispararla manualmente desde el panel admin.

#### Scenario: Administrador sincroniza pronósticos
- **WHEN** el administrador de plataforma activa "Sincronizar pronósticos" en el panel admin
- **THEN** el sistema ejecuta la sincronización de inmediato y muestra cuántos pronósticos se actualizaron y los errores que hubo

#### Scenario: Usuario no administrador intenta sincronizar
- **WHEN** un usuario que no es administrador de plataforma invoca la sincronización
- **THEN** el sistema rechaza la solicitud

### Requirement: Modo de visibilidad de pronósticos por grupo
El administrador de plataforma SHALL poder configurar por grupo el modo de visibilidad de pronósticos: `off` (nadie los ve), `after_lock` (cada pronóstico se ve solo después de que cerró el pick de ese partido) o `always` (se ven siempre). El modo por defecto SHALL ser `off`. La visibilidad SHALL aplicarse a nivel de base de datos (RLS), no solo en la interfaz. El administrador de plataforma SHALL poder ver siempre todos los pronósticos.

#### Scenario: Grupo con modo off
- **WHEN** un miembro de un grupo con modo `off` consulta los pronósticos de la semana
- **THEN** el sistema no le devuelve ningún pronóstico

#### Scenario: Grupo con modo after_lock, pick todavía abierto
- **WHEN** un miembro de un grupo con modo `after_lock` consulta el pronóstico de un partido cuyo pick aún no cierra
- **THEN** el sistema no le devuelve ese pronóstico

#### Scenario: Grupo con modo after_lock, pick cerrado
- **WHEN** un miembro de un grupo con modo `after_lock` consulta el pronóstico de un partido cuyo pick ya cerró (según `weekly_pick_group_deadline`)
- **THEN** el sistema le devuelve ese pronóstico

#### Scenario: Grupo con modo always
- **WHEN** un miembro de un grupo con modo `always` consulta los pronósticos de la semana
- **THEN** el sistema le devuelve todos los pronósticos disponibles

#### Scenario: Grupo sin configuración guardada
- **WHEN** un grupo no tiene fila en la configuración del Pick'em
- **THEN** el sistema lo trata como modo `off`

### Requirement: Pronóstico en la hoja de picks
Cuando un pronóstico es visible para el usuario, la hoja de picks de la quiniela semanal SHALL mostrar, en el renglón del partido, el porcentaje de victoria de cada equipo atribuido al modelo de ESPN y, si existe spread, en un renglón aparte atribuido a las casas de apuestas, el equipo favorito según la línea y por cuántos puntos. Ambos datos SHALL mostrarse separados y con su fuente, porque pueden no coincidir en el favorito. La interfaz SHALL NOT mostrar momios (moneyline), nombres ni logos de casas de apuestas, ni ligas hacia ellas.

#### Scenario: Pronóstico visible con spread
- **WHEN** el usuario ve un partido con pronóstico visible de 73.6% local y 26.2% visitante y spread de -7.5 para el local
- **THEN** el renglón muestra una barra proporcional con "74%" del lado local y "26%" del lado visitante etiquetada "Pronóstico ESPN", y debajo, separado, el texto "Línea de apuestas: JAX por 7.5 pts"

#### Scenario: Modelo y línea no coinciden en el favorito
- **WHEN** el modelo de ESPN da 56% al visitante SF pero la línea favorece al local SEA por 3
- **THEN** la barra muestra a SF con 56% como "Pronóstico ESPN" y el renglón aparte muestra "Línea de apuestas: SEA por 3 pts", sin combinarlos en un solo favorito

#### Scenario: Sin pronóstico visible
- **WHEN** el partido no tiene pronóstico o no es visible para el usuario
- **THEN** el renglón se muestra igual que hoy, sin espacio reservado ni mensaje

#### Scenario: Pronóstico no interfiere con el pick
- **WHEN** el usuario toca el lado de un equipo en un renglón que muestra pronóstico
- **THEN** el pick se registra igual que sin pronóstico; la barra no es interactiva
