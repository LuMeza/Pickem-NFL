/**
 * Colores de marca por equipo NFL (dato público, no logos) — usados para
 * renderizar un escudo de color en vez de una imagen con derechos de autor.
 */
export interface TeamColors {
  primary: string
  secondary: string
}

export const TEAM_COLORS: Record<string, TeamColors> = {
  ARI: { primary: '#97233F', secondary: '#FFB612' },
  ATL: { primary: '#A71930', secondary: '#000000' },
  BAL: { primary: '#241773', secondary: '#9E7C0C' },
  BUF: { primary: '#00338D', secondary: '#C60C30' },
  CAR: { primary: '#0085CA', secondary: '#101820' },
  CHI: { primary: '#0B162A', secondary: '#C83803' },
  CIN: { primary: '#FB4F14', secondary: '#000000' },
  CLE: { primary: '#311D00', secondary: '#FF3C00' },
  DAL: { primary: '#041E42', secondary: '#869397' },
  DEN: { primary: '#FB4F14', secondary: '#002244' },
  DET: { primary: '#0076B6', secondary: '#B0B7BC' },
  GB: { primary: '#203731', secondary: '#FFB612' },
  HOU: { primary: '#03202F', secondary: '#A71930' },
  IND: { primary: '#002C5F', secondary: '#A2AAAD' },
  JAX: { primary: '#101820', secondary: '#D7A22A' },
  KC: { primary: '#E31837', secondary: '#FFB81C' },
  LAC: { primary: '#0080C6', secondary: '#FFC20E' },
  LAR: { primary: '#003594', secondary: '#FFA300' },
  LV: { primary: '#000000', secondary: '#A5ACAF' },
  MIA: { primary: '#008E97', secondary: '#FC4C02' },
  MIN: { primary: '#4F2683', secondary: '#FFC62F' },
  NE: { primary: '#002244', secondary: '#C60C30' },
  NO: { primary: '#D3BC8D', secondary: '#101820' },
  NYG: { primary: '#0B2265', secondary: '#A71930' },
  NYJ: { primary: '#125740', secondary: '#000000' },
  PHI: { primary: '#004C54', secondary: '#A5ACAF' },
  PIT: { primary: '#FFB612', secondary: '#101820' },
  SEA: { primary: '#002244', secondary: '#69BE28' },
  SF: { primary: '#AA0000', secondary: '#B3995D' },
  TB: { primary: '#D50A0A', secondary: '#34302B' },
  TEN: { primary: '#0C2340', secondary: '#4B92DB' },
  WAS: { primary: '#5A1414', secondary: '#FFB612' },
}

const FALLBACK_COLORS: TeamColors = { primary: '#141B23', secondary: '#8A97A6' }

export function getTeamColors(teamId: string): TeamColors {
  return TEAM_COLORS[teamId] ?? FALLBACK_COLORS
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastTextColor(bgHex: string): string {
  return relativeLuminance(hexToRgb(bgHex)) > 0.35 ? '#0B0F14' : '#F4F6F8'
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  return `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

const MIN_TEXT_LUMINANCE = 0.18

/**
 * Color de marca ajustado para usarse como TEXTO sobre el fondo oscuro de
 * la app (pick elegido, ver Cancha Nocturna) — a diferencia de
 * `getTeamColors(...).primary`, que es el color de marca "puro" y sirve
 * bien para logos/gradientes pero varios equipos (Patriots, Bears, Cowboys,
 * Raiders...) lo tienen casi negro, ilegible como texto sobre una UI ya de
 * por si oscura. Si el primario no alcanza una luminancia minima legible,
 * prueba el secundario; si tampoco alcanza, aclara el primario mezclandolo
 * con blanco (conserva el tono de marca en vez de caer a un lima generico).
 */
export function getReadableAccent(teamId: string): string {
  const { primary, secondary } = getTeamColors(teamId)
  if (relativeLuminance(hexToRgb(primary)) >= MIN_TEXT_LUMINANCE) return primary
  if (relativeLuminance(hexToRgb(secondary)) >= MIN_TEXT_LUMINANCE) return secondary
  return lighten(primary, 0.55)
}
