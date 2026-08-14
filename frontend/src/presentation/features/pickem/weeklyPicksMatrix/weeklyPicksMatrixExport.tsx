import { ExportPage } from '@/presentation/features/catalog/calendarExport/ExportLayouts'
import { downloadPagesAsPdf } from '@/presentation/features/catalog/calendarExport/exportCapture'
import { getTeamLogoUrl } from '@/presentation/components/TeamBadge/teamLogos'
import type { Game } from '@/core/entities/catalog'
import { pickStatus, pickedTeamId, type WeeklyPicksMatrixUser } from './WeeklyPicksMatrix'
import styles from './weeklyPicksMatrixExport.module.css'

/** Columna usuario fija + una columna angosta por partido — sin `loading="lazy"` (el nodo se captura fuera de viewport, ver ExportLayouts.tsx ExportBadge). */
const USER_COL_WIDTH = 170
const GAME_COL_WIDTH = 60
const PAGE_PADDING = 90
const MIN_WIDTH = 640
const MAX_WIDTH = 2400

function ExportBadge({ teamId, size }: { teamId: string; size: number }) {
  return (
    <img src={getTeamLogoUrl(teamId)} alt="" className={styles.badge} style={{ width: size, height: size }} />
  )
}

function widthForGames(gameCount: number): number {
  const raw = USER_COL_WIDTH + gameCount * GAME_COL_WIDTH + PAGE_PADDING
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, raw))
}

function ExportMatrixTable({ rows, games }: { rows: Map<string, WeeklyPicksMatrixUser>; games: Game[] }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.userCell}>Usuario</th>
          {games.map((game) => (
            <th key={game.id} className={styles.gameCell}>
              <span className={styles.gameTeams}>
                <ExportBadge teamId={game.homeTeamId} size={22} />
                <ExportBadge teamId={game.awayTeamId} size={22} />
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...rows.entries()].map(([userId, entry]) => (
          <tr key={userId}>
            <td className={styles.userCell}>{entry.displayName}</td>
            {games.map((game) => {
              const row = entry.rowsByGame.get(game.id)
              const status = pickStatus(row?.pick ?? null, row?.outcome ?? null)
              const teamId = pickedTeamId(row?.pick ?? null, game)
              return (
                <td key={game.id} className={styles.pickCell} data-status={status}>
                  {teamId ? <ExportBadge teamId={teamId} size={22} /> : <span className={styles.dash}>—</span>}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export interface SurvivorExportRow {
  displayName: string
  teamId: string | null
  lifeNumber: number | null
  status: string
}

function ExportSurvivorTable({
  rows,
  teamName,
}: {
  rows: SurvivorExportRow[]
  teamName: (id: string) => string
}) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.userCell}>Usuario</th>
          <th>Pick</th>
          <th>Vida</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.displayName}>
            <td className={styles.userCell}>{row.displayName}</td>
            <td>
              <span className={styles.teamPick}>
                {row.teamId && <ExportBadge teamId={row.teamId} size={22} />}
                {row.teamId ? teamName(row.teamId) : 'Sin pick'}
              </span>
            </td>
            <td>{row.lifeNumber ?? '—'}</td>
            <td>{row.status === 'eliminated' ? 'Eliminado' : 'Vivo'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export async function downloadWeeklyPicksMatrixPdf(params: {
  rows: Map<string, WeeklyPicksMatrixUser>
  games: Game[]
  title: string
  subtitle: string
  fileName: string
}): Promise<void> {
  const { rows, games, title, subtitle, fileName } = params
  const widthPx = widthForGames(games.length)
  await downloadPagesAsPdf(
    [
      {
        widthPx,
        node: (
          <ExportPage title={title} subtitle={subtitle} widthPx={widthPx}>
            <ExportMatrixTable rows={rows} games={games} />
          </ExportPage>
        ),
      },
    ],
    fileName,
  )
}

export async function downloadSurvivorPicksPdf(params: {
  rows: SurvivorExportRow[]
  teamName: (id: string) => string
  title: string
  subtitle: string
  fileName: string
}): Promise<void> {
  const { rows, teamName, title, subtitle, fileName } = params
  const widthPx = 640
  await downloadPagesAsPdf(
    [
      {
        widthPx,
        node: (
          <ExportPage title={title} subtitle={subtitle} widthPx={widthPx}>
            <ExportSurvivorTable rows={rows} teamName={teamName} />
          </ExportPage>
        ),
      },
    ],
    fileName,
  )
}
