/**
 * Iniciales para avatares: primera letra del primer y último nombre. Recorre
 * por caracteres reales (Array.from), no por unidades UTF-16, y salta lo que
 * no sea letra o número: con "Lu 🧸" el `[0]` de antes tomaba medio emoji y
 * pintaba "L�".
 */
export function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .map((word) => Array.from(word).filter((char) => /[\p{L}\p{N}]/u.test(char)))
    .filter((chars) => chars.length > 0)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0]!.slice(0, 2).join('').toUpperCase()
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase()
}
