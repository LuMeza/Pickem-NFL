# App Quiniela — Requerimientos Funcionales

## 1. Descripción general

Plataforma web (no app nativa) para llevar el seguimiento de predicciones deportivas entre grupos privados de usuarios (familia, amigos, compañeros de trabajo). La plataforma **no procesa pagos, no cobra cuotas y no reparte premios en efectivo** — es una herramienta de conteo, clasificación y estadísticas. Cualquier acuerdo económico entre los participantes de un grupo se organiza completamente fuera de la plataforma.

Se eligió formato web (en lugar de app para Android/iOS) por dos razones:
- Mayor privacidad: no requiere publicación en tiendas de aplicaciones ni cumplir sus políticas sobre juegos/apuestas.
- Acceso más simple para grupos cerrados vía link o código de invitación, sin fricción de descarga/instalación.

**Nota legal:** esta plataforma está diseñada intencionalmente para no captar, administrar ni distribuir apuestas en dinero, evitando así encuadrar en la regulación de juegos con apuestas. No debe agregarse ninguna funcionalidad de pago, cobro de cuotas, ni premios en efectivo dentro del producto sin antes consultar asesoría legal especializada.

---

## 2. Estructura general

- **Temporada regular**: del inicio de temporada hasta el comienzo de playoffs.
- **Temporada de playoffs**: sustituye la dinámica semanal en cuanto arranca.
- Todo el sistema funciona por **grupos privados**: un usuario crea un grupo, invita miembros (link o código), y cada grupo lleva sus propias tablas independientes.

---

## 3. Módulo 1 — Quiniela Semanal (opcional por usuario)

**Vigencia:**
- Arranca desde **pretemporada** (Pre Sem. 1, Pre Sem. 2, Pre Sem. 3, etc.) y continúa durante toda la temporada regular.
- Se **cierra automáticamente en cuanto arranca la ronda de playoffs** — a partir de ahí este módulo deja de generar semanas nuevas y el usuario pasa a jugar únicamente el Módulo 3 (Playoffs).

**Mecánica de entrada (opt-in):**
- La quiniela semanal es **opcional**: no todos los miembros del grupo participan.
- Debe existir un mecanismo explícito de **solicitud/aceptación**: el usuario solicita entrar a la quiniela semanal del grupo.
- El **admin del grupo** es quien otorga el acceso — normalmente después de confirmar el pago del pozo **por fuera de la plataforma** (efectivo, transferencia, etc.). La app solo refleja el estado de acceso (ej. "pendiente de aprobación" / "activo"), sin procesar el cobro en ningún momento.
- Un usuario sin acceso aprobado **no puede** registrar predicciones en este módulo, aunque sí puede ver la tabla si el admin lo permite.

**Mecánica de predicción:**
- 32 equipos en total (temporada regular NFL, además de los partidos de pretemporada aplicables).
- Cada semana, el usuario predice **qué equipo gana** cada partido (sin marcador exacto).
- Se debe poder marcar **empate** como opción válida, aunque sea un resultado poco común.
- El sistema calcula automáticamente los **aciertos por usuario** cada semana.

**Ganador:**
- Este módulo tiene **un solo ganador**: el usuario con más aciertos acumulados al cierre de la quiniela semanal (justo antes de que arranquen playoffs).
- Si dos o más usuarios empatan en el primer lugar, **el premio se divide entre los empatados** (el sistema no aplica regla de desempate; el reparto económico se resuelve entre los usuarios fuera de la plataforma).

**Salida esperada:**
- Tabla de posiciones semanal (ordenada por aciertos), visible solo para usuarios con acceso aprobado (o según lo defina el admin).
- Tabla de posiciones acumulada de temporada.
- Indicador de estado de acceso por usuario (solicitado / aprobado / sin acceso).
- Sin ningún campo de dinero, cuota de entrada o premio — solo puntos/aciertos y estado de acceso.

---

## 4. Módulo 2 — Survivor

**Mecánica:**
- Cada usuario elige **un equipo por semana** que cree que va a ganar.
- Si el equipo elegido gana, el usuario avanza a la siguiente semana.
- Si el equipo elegido pierde, el usuario queda eliminado del survivor (salvo que use una vida extra, ver abajo).
- **Restricción clave:** un mismo equipo no puede volver a usarse por el mismo usuario en toda la temporada.
- **Vidas extra:** cada usuario cuenta con hasta 2 oportunidades extra para regresar tras ser eliminado. Estas vidas son **gratuitas y limitadas por el sistema** (no se compran ni se cobran).

**Ganadores:**
- Este módulo tiene **tres ganadores**: 1er, 2do y 3er lugar, definidos por el orden en que los usuarios quedan eliminados (los últimos en caer ocupan las primeras posiciones). El último usuario que queda "vivo" en el grupo obtiene el 1er lugar.
- Si hay empate en la semana de eliminación entre dos o más usuarios para alguna de estas posiciones, se desempata por **quién duró más semanas con su vida original** (antes de usar cualquier vida extra). Si ambos usuarios llegaron a usar una vida extra, el desempate sigue siendo por quién duró más con su vida original, sin importar cuánto duraron después con la vida extra.

**Salida esperada:**
- Estado del usuario por semana: vivo / eliminado / vida extra usada.
- Historial de equipos ya utilizados por usuario (para evitar repetición).
- Ranking de supervivencia por grupo, con podio de 1er, 2do y 3er lugar.

---

## 5. Módulo 3 — Playoffs

**Mecánica:**
- Incluye todos los partidos de playoffs.
- Predicción por **diferencia de puntos**, con las siguientes opciones por partido:
  - Local: gana por más de 6 puntos.
  - Diferencia: gana por menos de 6 puntos (partido cerrado).
  - Visita: gana por más de 6 puntos.
- La quiniela semanal (Módulo 1) se cierra automáticamente en cuanto arranca la ronda de playoffs; a partir de ahí solo corre este módulo.
**Ganadores:**
- Este módulo tiene **tres ganadores**: 1er, 2do y 3er lugar por grupo, según el ranking final de aciertos de toda la ronda de playoffs.
- Si hay empate en aciertos entre dos o más usuarios para el 1er, 2do o 3er lugar, **el premio correspondiente a esa posición se divide entre los usuarios empatados** (el sistema no aplica una regla de desempate; el reparto económico se resuelve entre los usuarios fuera de la plataforma).

**Salida esperada:**
- Tabla de resultados por ronda de playoffs.
- Ranking final de temporada (top 3 por grupo).

---

## 6. Funcionalidades transversales

- **Grupos privados:** creación, invitación por link/código, administración de miembros por el creador del grupo.
- **Perfil de usuario:** historial de aciertos totales, % de acierto general, mejor semana, participación por módulo (quiniela, survivor, playoffs).
- **Notificaciones (opcional):** recordatorio antes del cierre de predicciones de cada semana/ronda.
- **Carga de resultados:** los resultados de partidos deben poder actualizarse manualmente por un administrador o mediante integración con una fuente de datos deportivos (a definir según presupuesto/API disponible).

---

## 7. Fuera de alcance (explícitamente excluido)

- Procesamiento de pagos o cuotas de entrada.
- Cálculo, retención o distribución de premios en efectivo.
- Cualquier texto o interfaz que sugiera "pagar", "cobrar" o "premio en efectivo".
- Publicación en tiendas de apps (Google Play / App Store) en esta fase.

---

## 8. Consideraciones técnicas sugeridas

- Aplicación web responsiva (prioridad a buen uso desde celular, ya que la mayoría de los usuarios entrarán desde ahí).
- Autenticación simple (correo o Google/Apple login).
- Base de datos con estructura por: usuarios, grupos, predicciones, resultados de partidos, tablas de posiciones.
- Panel de administrador para cargar resultados oficiales de partidos.
