/** Conferencia y division de cada equipo NFL (dato publico, no cambia entre temporadas). */
export interface TeamDivision {
  conference: 'AFC' | 'NFC'
  division: 'East' | 'North' | 'South' | 'West'
}

export const TEAM_DIVISIONS: Record<string, TeamDivision> = {
  BUF: { conference: 'AFC', division: 'East' },
  MIA: { conference: 'AFC', division: 'East' },
  NE: { conference: 'AFC', division: 'East' },
  NYJ: { conference: 'AFC', division: 'East' },
  BAL: { conference: 'AFC', division: 'North' },
  CIN: { conference: 'AFC', division: 'North' },
  CLE: { conference: 'AFC', division: 'North' },
  PIT: { conference: 'AFC', division: 'North' },
  HOU: { conference: 'AFC', division: 'South' },
  IND: { conference: 'AFC', division: 'South' },
  JAX: { conference: 'AFC', division: 'South' },
  TEN: { conference: 'AFC', division: 'South' },
  DEN: { conference: 'AFC', division: 'West' },
  KC: { conference: 'AFC', division: 'West' },
  LV: { conference: 'AFC', division: 'West' },
  LAC: { conference: 'AFC', division: 'West' },
  DAL: { conference: 'NFC', division: 'East' },
  NYG: { conference: 'NFC', division: 'East' },
  PHI: { conference: 'NFC', division: 'East' },
  WAS: { conference: 'NFC', division: 'East' },
  CHI: { conference: 'NFC', division: 'North' },
  DET: { conference: 'NFC', division: 'North' },
  GB: { conference: 'NFC', division: 'North' },
  MIN: { conference: 'NFC', division: 'North' },
  ATL: { conference: 'NFC', division: 'South' },
  CAR: { conference: 'NFC', division: 'South' },
  NO: { conference: 'NFC', division: 'South' },
  TB: { conference: 'NFC', division: 'South' },
  ARI: { conference: 'NFC', division: 'West' },
  LAR: { conference: 'NFC', division: 'West' },
  SF: { conference: 'NFC', division: 'West' },
  SEA: { conference: 'NFC', division: 'West' },
}

/** Orden de despliegue estandar: AFC este->oeste y luego NFC este->oeste. */
export const DIVISION_ORDER: TeamDivision[] = [
  { conference: 'AFC', division: 'East' },
  { conference: 'AFC', division: 'North' },
  { conference: 'AFC', division: 'South' },
  { conference: 'AFC', division: 'West' },
  { conference: 'NFC', division: 'East' },
  { conference: 'NFC', division: 'North' },
  { conference: 'NFC', division: 'South' },
  { conference: 'NFC', division: 'West' },
]

export function getTeamDivision(teamId: string): TeamDivision | null {
  return TEAM_DIVISIONS[teamId] ?? null
}
