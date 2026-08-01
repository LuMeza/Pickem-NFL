## Context

Cambio chico en superficie de código pero que toca un `check` constraint de
base de datos y tres capabilities ya implementadas (`catalogo-nfl`,
`sincronizacion-resultados-espn`) o en proposal (`prediccion-quiniela-semanal`).
Amerita dejar explícito el mapeo ESPN y el orden cronológico antes de tocar
specs/tasks, porque un mapeo mal hecho rompe la sincronización automática de
toda la pretemporada, no solo del Hall of Fame Game.

## Goals / Non-Goals

**Goals:**
- Modelar el Hall of Fame Game como su propio tipo de semana (`hof`), no como
  un número más dentro de `pretemporada`.
- Mantener el mapeo ESPN de `pretemporada` (Pre Sem. 1/2/3 → ESPN weeks 2-4)
  sin romperlo al introducir `hof`.
- Dejar la quiniela semanal (spec) correcta para cuando se implemente, sin
  implementar `weekly_picks` en este change.

**Non-Goals:**
- No se implementa `weekly_picks` ni ninguna pantalla de predicción —
  `modulo-pickem-semanal` sigue sin código propio; este change solo corrige
  qué semanas debería aceptar cuando exista.
- No se re-numera `pretemporada` (sigue siendo 1/2/3) ni se cambia su mapeo
  ESPN.
- No se agrega un segundo partido "hof" — el Hall of Fame Game es un único
  partido por temporada (`hof` número 1).

## Decisions

**1. `hof` como tipo de semana propio, `sort_order = 0` (antes de Pre Sem. 1)**
`weeks.type` amplía su `check` constraint a `hof | pretemporada | regular |
playoffs`. Se agrega una sola fila (`type='hof', number=1, sort_order=0`).
Alternativa descartada: tratarlo como `pretemporada` número 0 — se descarta
porque el resto del sistema ya asume que "Pre Sem. N" empieza en 1 (labels de
UI, mapeo ESPN con offset fijo `+1`); inventar un número 0 dentro del mismo
tipo es más confuso que un tipo nuevo con semántica propia. `sort_order = 0`
no colisiona con las filas ya sembradas (`pretemporada` ocupa 1-3, `regular`
4-21, `playoffs` 22-25) y no requiere reescribir `sort_order` de filas
existentes.

**2. Mapeo ESPN: `hof` → `{ seasontype: 1, week: 1 }`; `pretemporada` sin
cambios**
`espnParamsForWeek` gana una rama explícita para `type === 'hof'` que devuelve
`{ seasontype: 1, week: 1 }` — el propio Hall of Fame Game. La rama de
`pretemporada` (`{ seasontype: 1, week: week.number + 1 }`) no cambia: seguía
usando ese offset para saltarse la ESPN week 1, y ahora simplemente coincide
con que `hof` ya reclamó esa semana — el comentario del código se actualiza
para reflejarlo, no la fórmula. Sin la rama nueva, `hof` caería en el
`return` final (rama de playoffs, `seasontype: 3`) por ser el catch-all
actual — se vuelve `else if` explícito para evitar ese bug silencioso.

**3. La sincronización recoge `hof` sin cambios de código propios**
`sync-espn-results/index.ts` ya recorre genéricamente todas las filas de
`weeks` (no hardcodea tipos). Agregar la fila `hof` alcanza para que se
sincronice; solo se actualiza el comentario que menciona "25 semanas" a "26".

**4. Frontend: `hof` es un segmento propio en los selectores de semana**
`WeekType` gana el literal `'hof'`. `WeekSelector` y `TeamDetailPage` (cada
uno con su propio `SEGMENT_ORDER`/`SECTION_LABEL` y función `weekLabel` —
duplicación ya existente, fuera de alcance de este change refactorizarla)
agregan `hof` al inicio del orden de segmentos, con label "Hall of Fame" y sin
necesidad de `PLAYOFFS_ROUND_LABEL`-style lookup por número (siempre hay una
sola semana `hof`).

**5. `prediccion-quiniela-semanal`: `hof` es válido igual que `pretemporada`/
`regular`**
La spec (todavía sin implementación) cambia su requirement de "pretemporada o
temporada regular" a "pretemporada, hof o temporada regular". Cuando se
implemente `modulo-pickem-semanal`, el filtro de semanas válidas para
`weekly_picks` (hoy pensado como `type IN ('pretemporada','regular')`) deberá
incluir `'hof'` desde el inicio.

## Risks / Trade-offs

- [`WeeksRedirect.pickDefaultWeek` usa `weeks` completo como fallback si no
  hay semanas `regular` (ordenado por `number`), y ahora `hof` también tiene
  `number = 1`, igual que Pre Sem. 1] → Sin impacto real: ese fallback solo se
  ejecuta si no existen semanas `regular` (temporada recién sembrada, antes de
  correr el seed completo); no es un estado alcanzable en producción con el
  seed actual.
- [Bug silencioso si se olvida la rama explícita de `hof` en
  `espnParamsForWeek`] → Mitigado con un test que falla si `hof` cae en la
  rama de playoffs (`seasontype: 3`) en vez de `{ seasontype: 1, week: 1 }`.

## Migration Plan

- Migración aditiva: amplía el `check` constraint de `weeks.type` e inserta
  una fila nueva (`on conflict (sort_order) do nothing`, mismo patrón que la
  migración original de `weeks`). No modifica filas existentes.
- Rollback: eliminar la fila `hof` y devolver el `check` constraint a su lista
  anterior de valores (posible mientras no haya `games`/`weekly_picks`
  referenciando esa fila).
