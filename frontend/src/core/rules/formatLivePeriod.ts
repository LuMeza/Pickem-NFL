const PERIOD_LABELS: Record<number, string> = {
  1: '1er cuarto',
  2: '2do cuarto',
  3: '3er cuarto',
  4: '4to cuarto',
}

/** Traduce el cuarto/reloj en vivo que trae ESPN (games.live_period/live_clock) a una etiqueta corta en español. */
export function formatLivePeriod(period: number | null, clock: string | null): string | null {
  if (period === null) return null
  const label = period > 4 ? (period === 5 ? 'Tiempo extra' : `Tiempo extra ${period - 4}`) : (PERIOD_LABELS[period] ?? `Cuarto ${period}`)
  return clock ? `${label} · ${clock}` : label
}
