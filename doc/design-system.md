# App Quiniela — Sistema de Diseño

**Inspiración:** onetouch.football (Frame-Ux / From the French) — juego de cartas táctico de fútbol: fondo casi negro, glassmorphism, marquesina "LEGENDS OF THE GAME", cartas de jugador flotantes, tipografía display condensada en mayúsculas, CTAs en verde ácido/dorado.

**Adaptación:** onetouch.football es una landing de marketing para vender un juego. Nuestra app **no vende nada** — es un dashboard funcional donde el usuario entra cada semana a *hacer su pick*, ver tablas y checar su estado en el survivor. Tomamos la energía "carta de juego / marcador deportivo" del sitio de inspiración, pero la aterrizamos en patrones de producto: navegación persistente, tablas de datos legibles, formularios de predicción rápidos desde el celular. Nada de scroll-storytelling ni video hero — eso pertenece a un sitio de venta, no a una herramienta que se usa 50 veces por temporada.

---

## 1. Paleta de color

| Token | Hex | Uso |
|---|---|---|
| `--bg-base` | `#0B0F14` | Fondo general de la app (negro azulado, no negro puro) |
| `--bg-surface` | `#141B23` | Superficie de tarjetas/paneles antes de aplicar glass |
| `--glass-border` | `rgba(255,255,255,0.08)` | Borde de tarjetas glassmorphism |
| `--accent-lime` | `#C8FF3D` | Acción primaria, aciertos, "vivo" en survivor |
| `--accent-gold` | `#F2B705` | Podio, leyendas del grupo, rachas, badges de logro |
| `--danger` | `#FF5468` | Eliminado, pick perdido, alertas de cierre |
| `--text-primary` | `#F4F6F8` | Texto principal |
| `--text-muted` | `#8A97A6` | Texto secundario, metadatos, timestamps |

Reglas de uso:
- **Lime** es la única acción "positiva" del sistema — reservarlo para: botón de confirmar pick, check de acierto, estado "vivo". No usarlo decorativamente o pierde peso.
- **Dorado** es exclusivo de logros/ranking (podio, MVP de la semana, insignias de perfil) — nunca para botones de acción, así el usuario aprende a distinguir "esto es un logro" de "esto es una acción".
- Nunca usar rojo y dorado juntos en el mismo componente (ambigüedad alerta vs. logro).
- Superficies glass: `background: rgba(20,27,35,0.55)`, `backdrop-filter: blur(16px)`, borde 1px `--glass-border`. Usar con moderación — solo en tarjetas de pick y navegación flotante, no en toda la interfaz o se vuelve ruido visual en tablas largas.

---

## 2. Tipografía

| Rol | Fuente | Uso |
|---|---|---|
| Display | **Bebas Neue** | Títulos de sección, números de semana ("SEMANA 07"), nombres de módulo. Siempre en mayúsculas, tracking +2%. |
| Cuerpo | **Inter** | Todo el texto de interfaz: labels, botones, descripciones, formularios. Legibilidad en datos densos por encima de personalidad. |
| Datos/Numérica | **JetBrains Mono** | Marcadores, porcentajes de acierto, contadores de tiempo, folios. Los dígitos tabulares evitan que las tablas "bailen" al actualizar. |

Bebas Neue se usa con restricción: solo en encabezados de página y hitos (número de semana, "1ER LUGAR"). Nunca en párrafos ni en botones — condensada en mayúsculas es ilegible en texto largo.

Escala sugerida: Display 40/32/24px · Body 16/14px · Mono 14/12px (tabular-nums).

---

## 3. Layout

**Principio:** esto es un dashboard de uso repetido, no un sitio de una sola visita. Prioridad total a mobile — la mayoría entra desde el celular a hacer su pick antes del cierre.

```
┌─────────────────────────────┐
│ Header: Grupo + Semana + ⏱  │  ← barra fija, glass
├─────────────────────────────┤
│ Ticker "EN JUEGO"            │  ← marquesina horizontal (ver §6)
├─────────────────────────────┤
│                               │
│   Contenido del módulo        │
│   activo (scroll vertical)    │
│                               │
├─────────────────────────────┤
│ Nav inferior: 🏈 📋 🏆 👤    │  ← Quiniela / Survivor / Playoffs / Perfil
└─────────────────────────────┘
```

Breakpoints (3 rangos, sin zonas ambiguas):
- **Mobile (< 768px):** navegación inferior fija de 4 iconos (uno por módulo + perfil). Header colapsa a solo escudo del grupo + cuenta regresiva. Grid de partidos: 1 columna.
- **Tablet (768px – 1023px):** conserva la navegación inferior fija de mobile (aún no hay espacio horizontal cómodo para un sidebar persistente sin robarle ancho al contenido). Header muestra grupo + semana + cuenta regresiva completos. Grid de partidos: 2 columnas.
- **Desktop (≥ 1024px):** la nav inferior se convierte en sidebar izquierdo fijo; el ticker se mueve a una franja superior delgada. Contenido en dos columnas cuando aplica (tarjetas de partido a la izquierda, tabla de posiciones en un panel lateral derecho persistente). Grid de partidos: 3 columnas (nunca más — las tarjetas de pick necesitan espacio para respirar).

---

## 4. Componente firma: la carta de predicción

Esto es lo que hace que la app se sienta como "quiniela de cartas" en vez de un formulario genérico de radio buttons — es la pieza que tomamos más directamente de onetouch.football, pero con un propósito funcional real en vez de decorativo.

Cada partido de la semana se muestra como una **carta física**, no una fila de tabla:

- Estado **sin elegir**: carta glass, escudos de ambos equipos enfrentados al centro, línea VS en Bebas Neue. Los dos escudos son botones grandes (mínimo 44px táctil).
- Al tocar un equipo, **la carta hace flip** (rotateY, 300ms, ease-out) y revela el reverso: el equipo elegido en grande con borde `--accent-lime`, sello tipo "PICK CONFIRMADO" en dorado si faltan >24h, o en rojo si el cierre es inminente (<2h).
- Empate (solo Playoffs, opción "diferencia <6 pts"): la carta tiene un tercer estado central, sin flip completo — se ilumina el borde superior en vez de rotar.
- Cartas ya cerradas (partido jugado): pierden el glow, bajan opacidad al 70%, y muestran un check lime (acierto) o X roja (fallo) sobre el pick guardado — nunca se regeneran ni se pueden re-tocar.

Esto reemplaza cualquier tentación de usar dropdowns o radios: la metáfora de carta hace el pick memorable y evita errores de doble-click accidental (el flip requiere confirmación visual antes de comprometerse).

---

## 5. Patrones por módulo

**Módulo 1 — Quiniela Semanal**
- Header de módulo con cuenta regresiva mono (`HH:MM:SS`) al cierre de la semana — el reloj es el elemento de mayor jerarquía visual después del logo, refuerza urgencia sin texto.
- Grid de cartas de predicción (ver §4), una por partido.
- Estado de acceso (solicitado/aprobado/sin acceso) se muestra como un badge fijo bajo el header — nunca oculto en un menú, porque condiciona si el usuario puede interactuar con las cartas o solo mirarlas (cartas bloqueadas se ven con un ícono de candado sutil, sin flip habilitado).
- **Nunca** mostrar símbolos de moneda, "$", ni la palabra "pozo" en ningún estado — ni siquiera en placeholder o copy de error. Ver §8.

**Módulo 2 — Survivor**
- Vista de "racha" tipo timeline horizontal scrolleable: una ficha circular por semana jugada, verde lime si sobrevivió, roja si cayó, dorada con un ícono de corazón si usó vida extra esa semana.
- Selector de equipo de la semana: mismo patrón de carta que en Quiniela, pero con un estado adicional "ya usado" — el escudo aparece atenuado y no clickeable, con tooltip "Ya usaste a [Equipo] en la semana X".
- Podio de 3 lugares en dorado/plata/bronce (usar tonos dorado/gris/cobre de la paleta extendida, no colores genéricos de medalla) al cerrarse el módulo.

**Módulo 3 — Playoffs**
- Las cartas cambian de layout binario a **triple-opción**: Local (+6), Diferencia (<6), Visita (+6) — tres franjas verticales dentro de la misma carta en vez de dos escudos, con la franja central visualmente más angosta (comunica "resultado cerrado" por el propio tamaño).
- Bracket visual de rondas arriba de las cartas de la ronda activa (Wild Card → Div → Conf → Final), rondas pasadas colapsadas a una línea resumen.

**Tablas de posiciones (todos los módulos)**
- Tabla, no cartas — aquí la densidad de datos gana sobre el motivo de juego. Fuente mono para posición y aciertos, Inter para nombres.
- Fila del usuario actual siempre fija/resaltada con borde izquierdo lime, incluso si tiene que "pegarse" al hacer scroll en tablas de 40+ participantes.
- Empates: mostrar ambas filas con el mismo número de posición y un conector visual (llave `⎬`) en vez de reordenar arbitrariamente — refleja que el sistema no aplica desempate.

**Perfil**
- Header con historial de aciertos totales y % como cifras grandes en mono + Bebas Neue label, estilo "stat card" de FIFA Ultimate Team pero sin ilustración de jugador (evitamos cualquier semejanza con marca deportiva registrada).

---

## 6. El ticker "EN JUEGO"

Adaptación directa de la marquesina "LEGENDS OF THE GAME" del sitio de inspiración, pero con datos reales en vez de texto repetido:

- Franja delgada (32px), fondo `--bg-surface`, texto mono desplazándose horizontalmente.
- Contenido rotativo: "Cierra en 4h 12m" · "3 usuarios subieron al top 5 esta semana" · "[Nombre] lleva 6 semanas vivo en Survivor" · próximos cierres.
- Pausa el scroll al hacer hover/tap (accesibilidad — nunca texto en movimiento sin forma de detenerlo).
- Nunca incluye montos ni referencias a dinero (ver §8).

---

## 7. Estados vacíos y de error

Tono de la interfaz: directo, sin disculpas, en español neutro/casual coherente con cómo habla el grupo.

- **Sin acceso a Quiniela Semanal:** "Todavía no tienes acceso a este módulo. Pídele al administrador que lo active." — con botón "Solicitar acceso" en lime.
- **Semana cerrada sin picks:** "No registraste predicciones esta semana." — tono neutro, sin culpa, sin emoji de tristeza.
- **Grupo sin miembros aún:** "Invita a tu grupo con el link para empezar a llenar la tabla." + botón para copiar link.
- **Error de carga de resultados:** "No pudimos actualizar los resultados. Intenta de nuevo." — nunca "oops" ni lenguaje infantil.

---

## 8. Restricción de contenido (regla dura, no negociable)

Derivado directamente de la sección 7 del README: esta app **no procesa pagos ni refleja premios en efectivo** para evitar encuadrar en regulación de apuestas.

- Prohibido en cualquier parte de la UI: símbolos de moneda, la palabra "premio" junto a un monto, "cobrar", "pagar", "pozo" con cifra.
- Los únicos indicadores permitidos de dinero son de **estado**, no de monto: badges "pendiente de aprobación" / "activo" para el acceso a la Quiniela Semanal — nunca un número.
- Cualquier componente nuevo (banners, notificaciones push, emails transaccionales) debe pasar por esta misma regla antes de implementarse.

---

## 9. Movimiento

- Flip de carta de predicción: única animación con peso narrativo real (300ms, ease-out) — es la firma del sistema, se ejecuta bien y no se repite en otro lado.
- Transiciones de tabla (reordenamiento al actualizar resultados): fade + shift vertical, 200ms, nunca más — con 40-50 filas un reordenamiento animado agresivo se siente lento.
- Ticker: scroll continuo lineal, sin easing, velocidad constante ~40px/s.
- Respetar `prefers-reduced-motion`: el flip se reemplaza por un cross-fade instantáneo, el ticker se vuelve estático con flechas de paginación manual.

---

## 10. Accesibilidad y calidad base

- Contraste mínimo AA en texto sobre glass — verificar `--text-muted` sobre `--bg-surface` con blur, que suele bajar contraste real.
- Objetivo táctil mínimo 44×44px en escudos de equipo dentro de las cartas.
- Foco de teclado visible (outline lime 2px) en toda la navegación — el flip de carta debe poder activarse con Enter/Space, no solo con click/tap.
- El ticker nunca es la única fuente de una alerta crítica (cierre de semana) — siempre debe estar duplicada en el header con cuenta regresiva.
