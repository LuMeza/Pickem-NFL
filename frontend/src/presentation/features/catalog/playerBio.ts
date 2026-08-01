const INCHES_PER_METER = 39.3701
const LBS_PER_KG = 2.20462

/** ESPN manda altura/peso en imperial (pulgadas/libras) — se muestra en metrico. */
export function formatHeight(heightIn: number | null): string | null {
  if (heightIn === null) return null
  return `${(heightIn / INCHES_PER_METER).toFixed(2)} m`
}

export function formatWeight(weightLbs: number | null): string | null {
  if (weightLbs === null) return null
  return `${Math.round(weightLbs / LBS_PER_KG)} kg`
}

/** `birthDate` viene como "YYYY-MM-DD" — se muestra como "D/M/AAAA (edad)". */
export function formatBirthDate(birthDate: string | null, age: number | null): string | null {
  if (!birthDate) return null
  const [year, month, day] = birthDate.split('-')
  const date = `${Number(day)}/${Number(month)}/${year}`
  return age !== null ? `${date} (${age})` : date
}
