import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import type { Game } from '@/core/entities/catalog'
import styles from './WeeklyPicksMatrix.module.css'

export type PickStatus = 'correct' | 'incorrect' | 'pending' | 'noPick'

export function pickStatus(pick: string | null, outcome: string | null): PickStatus {
  if (pick === null) return 'noPick'
  if (outcome === null) return 'pending'
  return pick === outcome ? 'correct' : 'incorrect'
}

export function pickedTeamId(pick: string | null, game: Game | undefined): string | null {
  if (pick === null || pick === 'tie' || !game) return null
  return pick === 'home' ? game.homeTeamId : game.awayTeamId
}

export function pickLabel(pick: string | null, game: Game | undefined, teamName: (id: string) => string): string {
  if (pick === null) return 'Sin pick'
  if (pick === 'tie') return 'Empate'
  if (!game) return pick
  return teamName(pick === 'home' ? game.homeTeamId : game.awayTeamId)
}

export function matchupTitle(game: Game | undefined, teamName: (id: string) => string): string {
  if (!game) return 'Partido no encontrado'
  return `${teamName(game.homeTeamId)} vs ${teamName(game.awayTeamId)}`
}

export interface WeeklyPicksMatrixCell {
  pick: string | null
  outcome: string | null
}

export interface WeeklyPicksMatrixUser {
  displayName: string
  rowsByGame: Map<string, WeeklyPicksMatrixCell>
}

/**
 * Tabla usuario x partido (escudo del equipo elegido, color segun acierto/error).
 * Compartida entre el panel admin ("Picks de usuarios") y el apartado de
 * usuarios ("Picks de todos") — misma data, distinta fuente/gate de acceso.
 */
export function WeeklyPicksMatrix({
  rows,
  games,
  teamName,
}: {
  rows: Map<string, WeeklyPicksMatrixUser>
  games: Game[]
  teamName: (id: string) => string
}) {
  return (
    <div className={`${styles.tableScroll} glass-surface`}>
      <table className={styles.matrixTable}>
        <thead>
          <tr>
            <th className={styles.userHeaderCell}>Usuario</th>
            {games.map((game) => (
              <th key={game.id} className={styles.gameHeaderCell}>
                <span className={styles.gameHeaderTeams}>
                  <TeamBadge teamId={game.homeTeamId} size="sm" />
                  <TeamBadge teamId={game.awayTeamId} size="sm" />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...rows.entries()].map(([userId, entry]) => (
            <tr key={userId}>
              <td className={styles.userHeaderCell}>{entry.displayName}</td>
              {games.map((game) => {
                const row = entry.rowsByGame.get(game.id)
                const status = pickStatus(row?.pick ?? null, row?.outcome ?? null)
                const teamId = pickedTeamId(row?.pick ?? null, game)
                return (
                  <td
                    key={game.id}
                    className={styles.pickCell}
                    data-status={status}
                    title={`${matchupTitle(game, teamName)} — ${pickLabel(row?.pick ?? null, game, teamName)}`}
                  >
                    {teamId ? <TeamBadge teamId={teamId} size="sm" /> : <span className={styles.dash}>—</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
