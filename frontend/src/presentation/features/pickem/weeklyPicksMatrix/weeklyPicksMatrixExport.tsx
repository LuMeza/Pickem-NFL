import type { ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import { ExportPage } from '@/presentation/features/catalog/calendarExport/ExportLayouts'
import { downloadPagesAsPdf } from '@/presentation/features/catalog/calendarExport/exportCapture'
import { getTeamLogoUrl } from '@/presentation/components/TeamBadge/teamLogos'
import type { Game } from '@/core/entities/catalog'
import { pickStatus, pickedTeamId, type WeeklyPicksMatrixUser } from './WeeklyPicksMatrix'
import styles from './weeklyPicksMatrixExport.module.css'

/**
 * `ExportPage` fuerza un ancho de pagina fijo (`widthPx`) y `exportCapture`
 * rasteriza exactamente esos px — si la tabla real necesita mas ancho que el
 * que le dimos (mas partidos o nombres mas largos de lo previsto), el
 * contenido que sobra queda directamente fuera de la captura, cortado, en
 * vez de recortado con scroll visible. Pasó con una semana de pretemporada
 * con muchos partidos y nombres largos, con un ancho estimado por formula.
 * En vez de afinar constantes por columna a mano, se mide el ancho natural
 * real de esta misma tabla (mismo truco que exportCapture.ts usa para medir
 * el alto) y se arma la pagina a partir de esa medicion — no hace falta
 * volver a tocar esto si cambia la cantidad de partidos o el largo de los
 * nombres.
 */
const PAGE_CHROME_PADDING = 100
const MIN_WIDTH = 640
const MAX_WIDTH = 4000

function ExportBadge({ teamId, size }: { teamId: string; size: number }) {
  return (
    <img src={getTeamLogoUrl(teamId)} alt="" className={styles.badge} style={{ width: size, height: size }} />
  )
}

/** Monta `node` fuera de pantalla en un contenedor que se ajusta a su contenido (sin ancho forzado) y mide su ancho real. */
async function measureNaturalWidth(node: ReactElement): Promise<number> {
  const wrapper = document.createElement('div')
  wrapper.style.position = 'fixed'
  wrapper.style.top = '0'
  wrapper.style.left = '-10000px'
  wrapper.style.display = 'inline-block'
  wrapper.style.pointerEvents = 'none'
  document.body.appendChild(wrapper)

  const root = createRoot(wrapper)
  root.render(node)
  await new Promise((resolve) => setTimeout(resolve, 80))

  try {
    return Math.ceil(wrapper.getBoundingClientRect().width)
  } finally {
    root.unmount()
    wrapper.remove()
  }
}

function pageWidthFor(naturalTableWidth: number): number {
  const raw = naturalTableWidth + PAGE_CHROME_PADDING
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
  const naturalWidth = await measureNaturalWidth(<ExportMatrixTable rows={rows} games={games} />)
  const widthPx = pageWidthFor(naturalWidth)
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
  const naturalWidth = await measureNaturalWidth(<ExportSurvivorTable rows={rows} teamName={teamName} />)
  const widthPx = pageWidthFor(naturalWidth)
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
