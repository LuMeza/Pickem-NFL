/**
 * Foto de jugador servida directo desde el CDN público de ESPN (mismo origen
 * de datos que los logos de equipo, ver teamLogos.ts). El id es el
 * espn athlete id, que ya guardamos como id de `players` (sync-espn-roster).
 */
export function getPlayerHeadshotUrl(playerId: string): string {
  return `https://a.espncdn.com/i/headshots/nfl/players/full/${playerId}.png`
}
