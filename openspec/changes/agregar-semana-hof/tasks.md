## 1. Esquema de datos

- [x] 1.1 Migración: ampliar `check` constraint de `weeks.type` a `hof | pretemporada | regular | playoffs` + insertar fila `(type='hof', number=1, sort_order=0)`

## 2. Sincronización ESPN

- [x] 2.1 `mapping.ts`: agregar `InternalWeekType` `'hof'` y rama explícita en `espnParamsForWeek` (`{ seasontype: 1, week: 1 }`), como `else if` para no caer en la rama de playoffs
- [x] 2.2 Actualizar comentario de `pretemporada` en `espnParamsForWeek` (ya no "se salta" el Hall of Fame Game, ahora lo cubre el tipo `hof`)
- [x] 2.3 Test: `espnParamsForWeek` con `type: 'hof'` devuelve `{ seasontype: 1, week: 1 }` (y no la rama de playoffs)
- [x] 2.4 Actualizar comentario "25 semanas" → "26 semanas" en `sync-espn-results/index.ts`

## 3. Frontend — catálogo

- [x] 3.1 `core/entities/catalog.ts`: agregar `'hof'` a `WeekType`
- [x] 3.2 `WeekSelector.tsx`: agregar `hof` a `SEGMENT_ORDER` y `SEGMENT_LABEL` ("Hall of Fame"), y a `weekLabel`
- [x] 3.3 `TeamDetailPage.tsx`: agregar `hof` a `SECTION_LABEL`, `groupGamesByWeekType` y `weekLabel`

## 4. Specs

- [x] 4.1 Confirmar que `prediccion-quiniela-semanal` (sin implementación todavía) queda con `hof` como semana válida antes de que arranque su propio change de implementación
