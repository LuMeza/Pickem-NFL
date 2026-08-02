/**
 * Logo oficial de cada equipo, servido directo desde el CDN público de ESPN
 * (no se copian/redistribuyen los archivos, solo se referencian por URL —
 * mismo origen de datos que ya usa `integracion-resultados-espn`).
 * El slug es la abreviación de ESPN en minúsculas; coincide con nuestro id
 * interno salvo Washington (WAS interno -> wsh en ESPN, ver
 * supabase/migrations/20260719010000_espn_integration_columns.sql).
 */
const ESPN_SLUG_OVERRIDES: Record<string, string> = { WAS: 'wsh' }

export function getTeamLogoUrl(teamId: string): string {
  const slug = (ESPN_SLUG_OVERRIDES[teamId] ?? teamId).toLowerCase()
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${slug}.png`
}
