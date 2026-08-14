import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useCanViewPickemTables } from '@/presentation/hooks/useCanViewPickemTables'
import { useListWeeklyPicksBoard } from '@/presentation/hooks/useListWeeklyPicksBoard'
import { useNow } from '@/presentation/hooks/useNow'
import { WeekSelector } from '@/presentation/components/WeekSelector/WeekSelector'
import { Icon } from '@/presentation/components/Icon/Icon'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { isWeekFullyLocked } from '@/core/rules/isWeekFullyLocked'
import { weekLabel as formatWeekLabel } from './weekLabel'
import { WeeklyPicksMatrix, type WeeklyPicksMatrixUser } from './weeklyPicksMatrix/WeeklyPicksMatrix'
import { downloadWeeklyPicksMatrixPdf } from './weeklyPicksMatrix/weeklyPicksMatrixExport'
import type { WeekType } from '@/core/entities/catalog'
import styles from './WeeklyPicksBoardPage.module.css'

/** Playoffs queda fuera (modulo todavia no disponible, ver PickemHubPage), mismo filtro que AdminUserPicksPage. */
const ALLOWED_SEGMENTS: WeekType[] = ['hof', 'pretemporada', 'regular']

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

/**
 * Apartado de usuarios: picks de todos los demas del grupo para una semana
 * de pickem semanal. Se muestran recien cuando la semana entera ya bloqueo
 * sus picks (ver core/rules/isWeekFullyLocked) -- antes de eso no se pide
 * nada al backend, que igual devolveria vacio (mismo gate server-side).
 */
export function WeeklyPicksBoardPage() {
  const { weekId } = useParams<{ weekId: string }>()
  const { data: group } = useSession().group
  const { data: weeks } = useSession().weeks
  const { data: teams } = useSession().teams
  const { data: games } = useSession().games
  const { data: canView, run: loadCanView } = useCanViewPickemTables()
  const { status: boardStatus, data: boardRows, run: loadBoard } = useListWeeklyPicksBoard()
  const nowMs = useNow()
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (group) loadCanView({ groupId: group.id })
  }, [group, loadCanView])

  const activeWeek = weeks?.find((week) => week.id === weekId)
  const gamesForWeek = (games ?? [])
    .filter((game) => game.weekId === weekId)
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())
  const locked = isWeekFullyLocked(gamesForWeek, new Date(nowMs))

  useEffect(() => {
    if (group && weekId && locked) loadBoard({ groupId: group.id, weekId })
  }, [group, weekId, locked, loadBoard])

  if (!weekId) return null

  const teamName = (id: string) => teams?.find((team) => team.id === id)?.name ?? id

  const rowsByUser = new Map<string, WeeklyPicksMatrixUser>()
  boardRows?.forEach((row) => {
    const entry = rowsByUser.get(row.userId) ?? { displayName: row.displayName, rowsByGame: new Map() }
    entry.rowsByGame.set(row.gameId, row)
    rowsByUser.set(row.userId, entry)
  })

  async function handleDownloadPdf() {
    if (downloading || !activeWeek || rowsByUser.size === 0) return
    setDownloading(true)
    try {
      await downloadWeeklyPicksMatrixPdf({
        rows: rowsByUser,
        games: gamesForWeek,
        title: formatWeekLabel(activeWeek),
        subtitle: 'Picks de todos',
        fileName: `picks-de-todos-${slugify(formatWeekLabel(activeWeek))}.pdf`,
      })
    } catch (err) {
      console.error('No se pudo generar el PDF de picks', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section>
      <span className="kicker">
        <Icon name="users" size={13} /> Pickem semanal
      </span>
      <h1 className="text-display-lg">Picks de todos</h1>
      <p className={`text-body-sm text-muted ${styles.intro}`}>
        Los picks de los demás se ven recién cuando se bloquean todos los partidos de la semana.
      </p>
      <WeekSelector activeWeekId={weekId} linkTo={(id) => `/pickem/picks/${id}`} allowedSegments={ALLOWED_SEGMENTS} />

      {canView === false && <EmptyState message={EMPTY_STATE_COPY.noModuleAccess} />}

      {canView && !locked && (
        <EmptyState message="Vas a poder ver los picks de los demás apenas se bloqueen todos los partidos de la semana (domingo, después del primer partido)." />
      )}

      {canView && locked && (
        <>
          {boardStatus === 'pending' && <LoadingSpinner variant="inline" />}
          {boardStatus === 'error' && <p role="alert">No se pudieron cargar los picks.</p>}
          {rowsByUser.size === 0 && boardStatus === 'success' && (
            <EmptyState message="Nadie tiene picks para esta semana." />
          )}
          {rowsByUser.size > 0 && (
            <>
              <button
                type="button"
                className={`button-secondary ${styles.downloadButton}`}
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                <Icon name="download" size={14} />
                {downloading ? 'Generando PDF...' : 'Descargar PDF'}
              </button>
              <WeeklyPicksMatrix rows={rowsByUser} games={gamesForWeek} teamName={teamName} />
            </>
          )}
        </>
      )}
    </section>
  )
}
