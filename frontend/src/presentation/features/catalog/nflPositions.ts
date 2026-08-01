/** Diccionario de posiciones NFL (abreviacion ESPN -> nombre en español) para el glosario de la plantilla — los usuarios nuevos al pickem no necesariamente conocen las siglas. */
export const POSITION_LABEL: Record<string, string> = {
  QB: 'Mariscal de campo',
  RB: 'Corredor',
  FB: 'Fullback (corredor de bloqueo)',
  WR: 'Receptor abierto',
  TE: 'Ala cerrada',
  T: 'Tackle ofensivo',
  OT: 'Tackle ofensivo',
  G: 'Guardia ofensivo',
  OG: 'Guardia ofensivo',
  C: 'Centro',
  OL: 'Linea ofensiva',
  DE: 'Ala defensiva',
  DT: 'Tackle defensivo',
  NT: 'Nose tackle',
  DL: 'Linea defensiva',
  LB: 'Apoyador',
  ILB: 'Apoyador interior',
  MLB: 'Apoyador central',
  OLB: 'Apoyador externo',
  CB: 'Esquinero',
  S: 'Profundo (safety)',
  FS: 'Profundo libre',
  SS: 'Profundo fuerte',
  DB: 'Back defensivo',
  K: 'Pateador',
  PK: 'Pateador',
  P: 'Pateador de despeje (punter)',
  LS: 'Centro largo (long snapper)',
  KR: 'Regresador de patadas',
  PR: 'Regresador de despejes',
}

export function getPositionLabel(abbreviation: string | null): string | null {
  if (!abbreviation) return null
  return POSITION_LABEL[abbreviation] ?? null
}
