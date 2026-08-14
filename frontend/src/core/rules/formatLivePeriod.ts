const PERIOD_LABELS: Record<number, string> = {
  1: '1er cuarto',
  2: '2do cuarto',
  3: '3er cuarto',
  4: '4to cuarto',
}

/**
 * Traduce el cuarto en vivo que trae ESPN (games.live_period) a una etiqueta
 * corta en español. No incluye el reloj: solo se refresca cada 15 min (ver
 * sync-espn-results), asi que mostrarlo se ve "pegado" en vez de en vivo.
 */
export function formatLivePeriod(period: number | null): string | null {
  if (period === null) return null
  return period > 4 ? (period === 5 ? 'Tiempo extra' : `Tiempo extra ${period - 4}`) : (PERIOD_LABELS[period] ?? `Cuarto ${period}`)
}
