import type { PickCell } from '@/core/rules/comparePicks'

/** Un jugador con sus picks de la semana indexados por partido. */
export interface BoardUser {
  userId: string
  displayName: string
  cells: Map<string, PickCell>
}
