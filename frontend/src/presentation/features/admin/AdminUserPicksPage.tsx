import { useEffect, useState } from 'react'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListGroupMembers } from '@/presentation/hooks/useListGroupMembers'
import { useListAdminWeeklyPicksForWeek } from '@/presentation/hooks/useListAdminWeeklyPicksForWeek'
import { useListAdminSurvivorPicksForWeek } from '@/presentation/hooks/useListAdminSurvivorPicksForWeek'
import { useListAdminWeeklyPicksForUser } from '@/presentation/hooks/useListAdminWeeklyPicksForUser'
import { useListAdminSurvivorPicksForUser } from '@/presentation/hooks/useListAdminSurvivorPicksForUser'
import { useListSurvivorGroupState } from '@/presentation/hooks/useListSurvivorGroupState'
import { useListAdminWeeklyPayments } from '@/presentation/hooks/useListAdminWeeklyPayments'
import { useSetAdminWeeklyPayment } from '@/presentation/hooks/useSetAdminWeeklyPayment'
import { useListAdminSurvivorPayments } from '@/presentation/hooks/useListAdminSurvivorPayments'
import { useSetAdminSurvivorPayment } from '@/presentation/hooks/useSetAdminSurvivorPayment'
import { Icon } from '@/presentation/components/Icon/Icon'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { WeekSelector } from '@/presentation/components/WeekSelector/WeekSelector'
import { weekLabel as formatWeekLabel } from '@/presentation/features/pickem/weekLabel'
import {
  WeeklyPicksMatrix,
  pickStatus,
  pickedTeamId,
  pickLabel,
  type WeeklyPicksMatrixUser,
} from '@/presentation/features/pickem/weeklyPicksMatrix/WeeklyPicksMatrix'
import {
  downloadWeeklyPicksMatrixPdf,
  downloadSurvivorPicksPdf,
} from '@/presentation/features/pickem/weeklyPicksMatrix/weeklyPicksMatrixExport'
import type { Game, Week, WeekType } from '@/core/entities/catalog'
import type { AdminUserWeeklyPick } from '@/core/ports/AdminPicksRepository'
import type { SurvivorLife } from '@/core/entities/survivor'
import styles from './AdminUserPicksPage.module.css'

type Mode = 'porSemana' | 'porUsuario' | 'pagos'
type Quiniela = 'weekly' | 'survivor'
const SURVIVOR_LIVES: SurvivorLife[] = [1, 2, 3]
/** Segmentos de temporada validos por quiniela — mismo criterio que ya filtraba el <select> de semana. */
const WEEKLY_SEGMENTS: WeekType[] = ['hof', 'pretemporada', 'regular']
const SURVIVOR_SEGMENTS: WeekType[] = ['regular']

function weekLabel(week: Week | undefined): string {
  return week ? formatWeekLabel(week) : ''
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

/** Escudos de local/visita + nombres, mismo patron que AdminResultsPage. */
function MatchupDisplay({ game, teamName }: { game: Game | undefined; teamName: (id: string) => string }) {
  if (!game) return <span className="text-body-sm text-muted">Partido no encontrado</span>
  return (
    <span className={styles.matchup}>
      <TeamBadge teamId={game.homeTeamId} size="sm" />
      <span className="text-body-sm">
        {teamName(game.homeTeamId)} <span className="text-muted">vs</span> {teamName(game.awayTeamId)}
      </span>
      <TeamBadge teamId={game.awayTeamId} size="sm" />
    </span>
  )
}

/** Escudo + nombre del equipo elegido, o el texto "Empate"/"Sin pick" sin escudo. */
function TeamPick({
  pick,
  game,
  teamName,
}: {
  pick: string | null
  game: Game | undefined
  teamName: (id: string) => string
}) {
  const teamId = pickedTeamId(pick, game)
  return (
    <span className={styles.teamPick}>
      {teamId && <TeamBadge teamId={teamId} size="sm" />}
      {pickLabel(pick, game, teamName)}
    </span>
  )
}

/** Panel admin: picks de cualquier usuario en pickem semanal y survivor, por semana o por usuario. */
export function AdminUserPicksPage() {
  const { group: groupResource, weeks: weeksResource, teams: teamsResource, games: gamesResource } = useSession()
  const { data: group } = groupResource
  const { data: weeks } = weeksResource
  const { data: teams } = teamsResource
  const { data: games } = gamesResource
  const { data: members, run: loadMembers } = useListGroupMembers()

  const [mode, setMode] = useState<Mode>('porSemana')
  const [quiniela, setQuiniela] = useState<Quiniela>('weekly')
  const [selectedWeekId, setSelectedWeekId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [paymentsQuiniela, setPaymentsQuiniela] = useState<Quiniela>('weekly')
  const [paymentsWeekId, setPaymentsWeekId] = useState('')

  const {
    status: weeklyWeekStatus,
    data: weeklyWeekRows,
    run: loadWeeklyForWeek,
  } = useListAdminWeeklyPicksForWeek()
  const {
    status: survivorWeekStatus,
    data: survivorWeekRows,
    run: loadSurvivorForWeek,
  } = useListAdminSurvivorPicksForWeek()
  const {
    status: userWeeklyStatus,
    data: userWeeklyPicks,
    run: loadUserWeekly,
  } = useListAdminWeeklyPicksForUser()
  const {
    status: userSurvivorStatus,
    data: userSurvivorPicks,
    run: loadUserSurvivor,
  } = useListAdminSurvivorPicksForUser()
  const {
    status: weeklyPaymentsStatus,
    data: weeklyPayments,
    run: loadWeeklyPayments,
  } = useListAdminWeeklyPayments()
  const { run: setWeeklyPayment } = useSetAdminWeeklyPayment()
  const {
    status: survivorPaymentsStatus,
    data: survivorPayments,
    run: loadSurvivorPayments,
  } = useListAdminSurvivorPayments()
  const { run: setSurvivorPayment } = useSetAdminSurvivorPayment()
  const {
    status: survivorRosterStatus,
    data: survivorRoster,
    run: loadSurvivorRoster,
  } = useListSurvivorGroupState()

  useEffect(() => {
    if (group) loadMembers({ groupId: group.id })
  }, [group, loadMembers])

  useEffect(() => {
    if (!group || mode !== 'porSemana' || !selectedWeekId) return
    if (quiniela === 'weekly') {
      loadWeeklyForWeek({ groupId: group.id, weekId: selectedWeekId })
      loadWeeklyPayments({ groupId: group.id, weekId: selectedWeekId })
    } else {
      loadSurvivorForWeek({ groupId: group.id, weekId: selectedWeekId })
      loadSurvivorPayments({ groupId: group.id })
    }
  }, [
    group,
    mode,
    quiniela,
    selectedWeekId,
    loadWeeklyForWeek,
    loadSurvivorForWeek,
    loadWeeklyPayments,
    loadSurvivorPayments,
  ])

  useEffect(() => {
    if (!group || mode !== 'porUsuario' || !selectedUserId) return
    loadUserWeekly({ groupId: group.id, userId: selectedUserId })
    loadUserSurvivor({ groupId: group.id, userId: selectedUserId })
  }, [group, mode, selectedUserId, loadUserWeekly, loadUserSurvivor])

  const reloadSurvivorPayments = () => {
    if (group) loadSurvivorPayments({ groupId: group.id })
  }

  useEffect(() => {
    if (!group || mode !== 'pagos' || paymentsQuiniela !== 'weekly' || !paymentsWeekId) return
    loadWeeklyPayments({ groupId: group.id, weekId: paymentsWeekId })
  }, [group, mode, paymentsQuiniela, paymentsWeekId, loadWeeklyPayments])

  useEffect(() => {
    if (!group || mode !== 'pagos' || paymentsQuiniela !== 'survivor') return
    loadSurvivorPayments({ groupId: group.id })
    loadSurvivorRoster({ groupId: group.id })
  }, [group, mode, paymentsQuiniela, loadSurvivorPayments, loadSurvivorRoster])

  /** weekId explicito porque esta misma tabla de pagos se usa tanto desde "Por semana" (selectedWeekId) como desde "Pagos" (paymentsWeekId). */
  async function handleToggleWeeklyPayment(weekId: string, userId: string, paid: boolean) {
    if (!group || !weekId) return
    await setWeeklyPayment({ groupId: group.id, weekId, userId, paid })
    loadWeeklyPayments({ groupId: group.id, weekId })
  }

  async function handleToggleSurvivorPayment(userId: string, lifeNumber: SurvivorLife, paid: boolean) {
    if (!group) return
    await setSurvivorPayment({ groupId: group.id, userId, lifeNumber, paid })
    reloadSurvivorPayments()
  }

  function renderPaidPill(paid: boolean, onToggle: () => void) {
    return (
      <button
        type="button"
        aria-pressed={paid}
        className={`${styles.paidPill} ${paid ? styles.paidPillOn : styles.paidPillOff}`}
        onClick={onToggle}
      >
        {paid && <Icon name="check" size={12} />}
        {paid ? 'Pagó' : 'Falta'}
      </button>
    )
  }

  /** Version compacta del pill de pago (circulo, sin texto) para ir pegada al nombre en tablas con muchas columnas. */
  function renderPaidDot(displayName: string, paid: boolean, onToggle: () => void) {
    return (
      <button
        type="button"
        aria-pressed={paid}
        aria-label={`${displayName}: ${paid ? 'pagó' : 'falta pagar'}`}
        title={paid ? 'Pagó' : 'Falta pagar'}
        className={`${styles.paidDot} ${paid ? styles.paidPillOn : styles.paidPillOff}`}
        onClick={onToggle}
      >
        {paid && <Icon name="check" size={11} />}
      </button>
    )
  }

  const weeklyPaidByUser = new Map((weeklyPayments ?? []).map((row) => [row.userId, row.paid]))
  const survivorPaidByUserAndLife = new Map<string, Map<SurvivorLife, boolean>>()
  survivorPayments?.forEach((row) => {
    const byLife = survivorPaidByUserAndLife.get(row.userId) ?? new Map<SurvivorLife, boolean>()
    byLife.set(row.lifeNumber, row.paid)
    survivorPaidByUserAndLife.set(row.userId, byLife)
  })
  const teamName = (id: string) => teams?.find((team) => team.id === id)?.name ?? id
  const gameById = new Map((games ?? []).map((game) => [game.id, game]))
  const orderedWeeks = weeks ?? []

  const gamesForSelectedWeek = (games ?? [])
    .filter((game) => game.weekId === selectedWeekId)
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())

  const weeklyByUser = new Map<string, WeeklyPicksMatrixUser>()
  weeklyWeekRows?.forEach((row) => {
    const entry = weeklyByUser.get(row.userId) ?? { displayName: row.displayName, rowsByGame: new Map() }
    entry.rowsByGame.set(row.gameId, row)
    weeklyByUser.set(row.userId, entry)
  })

  /** El PDF es para mandarselo a los jugadores reales, asi que a diferencia de la vista en pantalla no incluye admins ni cuentas de prueba. */
  const weeklyByUserForExport = new Map<string, WeeklyPicksMatrixUser>()
  weeklyWeekRows?.forEach((row) => {
    if (row.isAdmin || row.isTestAccount) return
    const entry = weeklyByUserForExport.get(row.userId) ?? { displayName: row.displayName, rowsByGame: new Map() }
    entry.rowsByGame.set(row.gameId, row)
    weeklyByUserForExport.set(row.userId, entry)
  })

  const survivorWeekRowsForExport = (survivorWeekRows ?? []).filter((row) => !row.isAdmin && !row.isTestAccount)

  const userWeeklyByWeek = new Map<string, AdminUserWeeklyPick[]>()
  userWeeklyPicks?.forEach((pick) => {
    const list = userWeeklyByWeek.get(pick.weekId) ?? []
    list.push(pick)
    userWeeklyByWeek.set(pick.weekId, list)
  })
  const userWeeklyWeeksOrdered = orderedWeeks.filter((week) => userWeeklyByWeek.has(week.id))

  const userSurvivorByWeek = new Map((userSurvivorPicks ?? []).map((pick) => [pick.weekId, pick]))
  const userSurvivorWeeksOrdered = orderedWeeks.filter((week) => userSurvivorByWeek.has(week.id))

  const selectedWeek = weeks?.find((week) => week.id === selectedWeekId)

  async function handleDownloadWeeklyPdf() {
    if (downloadingPdf || !selectedWeek || weeklyByUserForExport.size === 0) return
    setDownloadingPdf(true)
    try {
      await downloadWeeklyPicksMatrixPdf({
        rows: weeklyByUserForExport,
        games: gamesForSelectedWeek,
        title: weekLabel(selectedWeek),
        subtitle: 'Pickem semanal — picks de usuarios',
        fileName: `picks-semanal-${slugify(weekLabel(selectedWeek))}.pdf`,
      })
    } catch (err) {
      console.error('No se pudo generar el PDF de picks', err)
    } finally {
      setDownloadingPdf(false)
    }
  }

  async function handleDownloadSurvivorPdf() {
    if (downloadingPdf || !selectedWeek || survivorWeekRowsForExport.length === 0) return
    setDownloadingPdf(true)
    try {
      await downloadSurvivorPicksPdf({
        rows: survivorWeekRowsForExport.map((row) => ({
          displayName: row.displayName,
          teamId: row.teamId,
          lifeNumber: row.lifeNumber,
          status: row.status,
        })),
        teamName,
        title: weekLabel(selectedWeek),
        subtitle: 'Survivor — picks de usuarios',
        fileName: `picks-survivor-${slugify(weekLabel(selectedWeek))}.pdf`,
      })
    } catch (err) {
      console.error('No se pudo generar el PDF de picks', err)
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <section>
      <span className="kicker">
        <Icon name="search" size={13} /> Panel admin
      </span>
      <h1 className="text-display-lg">Picks de usuarios</h1>

      <div className={styles.modeToggle}>
        <button
          type="button"
          className={mode === 'porSemana' ? '' : 'button-secondary'}
          onClick={() => setMode('porSemana')}
        >
          Por semana
        </button>
        <button
          type="button"
          className={mode === 'porUsuario' ? '' : 'button-secondary'}
          onClick={() => setMode('porUsuario')}
        >
          Por usuario
        </button>
        <button
          type="button"
          className={mode === 'pagos' ? '' : 'button-secondary'}
          onClick={() => setMode('pagos')}
        >
          Pagos
        </button>
      </div>

      {mode === 'porSemana' && (
        <>
          <div className={styles.filters}>
            <label>
              Quiniela
              <select
                value={quiniela}
                onChange={(event) => {
                  setQuiniela(event.target.value as Quiniela)
                  setSelectedWeekId('')
                }}
              >
                <option value="weekly">Pickem semanal</option>
                <option value="survivor">Survivor</option>
              </select>
            </label>
          </div>
          <WeekSelector
            activeWeekId={selectedWeekId}
            onSelect={setSelectedWeekId}
            allowedSegments={quiniela === 'weekly' ? WEEKLY_SEGMENTS : SURVIVOR_SEGMENTS}
          />

          {!selectedWeekId && <p className="text-body-sm text-muted">Elige una semana para ver los picks.</p>}

          {selectedWeekId && quiniela === 'weekly' && (
            <>
              {weeklyWeekStatus === 'pending' && <LoadingSpinner variant="inline" />}
              {weeklyWeekStatus === 'error' && <p role="alert">No se pudieron cargar los picks.</p>}
              {weeklyByUser.size === 0 && weeklyWeekStatus === 'success' && (
                <EmptyState message="Nadie tiene picks para esta semana." />
              )}
              {weeklyByUser.size > 0 && (
                <>
                  <p className={`text-body-sm text-muted ${styles.paymentsSummary}`}>
                    {weeklyByUser.size} usuario{weeklyByUser.size === 1 ? '' : 's'} ·{' '}
                    {[...weeklyByUser.keys()].filter((userId) => weeklyPaidByUser.get(userId)).length} pagaron esta
                    semana.
                  </p>
                  <button
                    type="button"
                    className={`button-secondary ${styles.downloadButton}`}
                    onClick={handleDownloadWeeklyPdf}
                    disabled={downloadingPdf || weeklyByUserForExport.size === 0}
                    title={weeklyByUserForExport.size === 0 ? 'No hay jugadores para exportar esta semana' : undefined}
                  >
                    <Icon name="download" size={14} />
                    {downloadingPdf ? 'Generando PDF...' : 'Descargar PDF'}
                  </button>
                  <WeeklyPicksMatrix
                    rows={weeklyByUser}
                    games={gamesForSelectedWeek}
                    teamName={teamName}
                    renderUserPrefix={(userId) => {
                      const paid = weeklyPaidByUser.get(userId) ?? false
                      const displayName = weeklyByUser.get(userId)?.displayName ?? ''
                      return renderPaidDot(displayName, paid, () =>
                        handleToggleWeeklyPayment(selectedWeekId, userId, !paid),
                      )
                    }}
                  />
                </>
              )}
            </>
          )}

          {selectedWeekId && quiniela === 'survivor' && (
            <>
              {survivorWeekStatus === 'pending' && <LoadingSpinner variant="inline" />}
              {survivorWeekStatus === 'error' && <p role="alert">No se pudieron cargar los picks.</p>}
              {survivorWeekRows && survivorWeekRows.length === 0 && (
                <EmptyState message="Nadie tiene picks de survivor para esta semana." />
              )}
              {survivorWeekRows && survivorWeekRows.length > 0 && (
                <>
                  <p className={`text-body-sm text-muted ${styles.paymentsSummary}`}>
                    {survivorWeekRows.length} usuario{survivorWeekRows.length === 1 ? '' : 's'} ·{' '}
                    {
                      survivorWeekRows.filter(
                        (row) => row.lifeNumber && survivorPaidByUserAndLife.get(row.userId)?.get(row.lifeNumber),
                      ).length
                    }{' '}
                    pagaron su vida actual.
                  </p>
                  <button
                    type="button"
                    className={`button-secondary ${styles.downloadButton}`}
                    onClick={handleDownloadSurvivorPdf}
                    disabled={downloadingPdf || survivorWeekRowsForExport.length === 0}
                    title={survivorWeekRowsForExport.length === 0 ? 'No hay jugadores para exportar esta semana' : undefined}
                  >
                    <Icon name="download" size={14} />
                    {downloadingPdf ? 'Generando PDF...' : 'Descargar PDF'}
                  </button>
                  <div className={`${styles.tableScroll} glass-surface`}>
                    <table className={styles.simpleTable}>
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Pick</th>
                          <th>Vida</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {survivorWeekRows.map((row) => {
                          const paid = row.lifeNumber
                            ? (survivorPaidByUserAndLife.get(row.userId)?.get(row.lifeNumber) ?? false)
                            : false
                          return (
                            <tr key={row.userId}>
                              <td>
                                <span className={styles.teamPick}>
                                  {row.lifeNumber &&
                                    renderPaidDot(row.displayName, paid, () =>
                                      handleToggleSurvivorPayment(row.userId, row.lifeNumber as SurvivorLife, !paid),
                                    )}
                                  {row.displayName}
                                </span>
                              </td>
                              <td data-status={row.teamId ? 'pending' : 'noPick'}>
                                <span className={styles.teamPick}>
                                  {row.teamId && <TeamBadge teamId={row.teamId} size="sm" />}
                                  {row.teamId ? teamName(row.teamId) : 'Sin pick'}
                                </span>
                              </td>
                              <td>{row.lifeNumber ?? '—'}</td>
                              <td>{row.status === 'eliminated' ? 'Eliminado' : 'Vivo'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {mode === 'porUsuario' && (
        <>
          <label>
            Usuario
            <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
              <option value="">Selecciona un usuario</option>
              {members?.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.displayName}
                </option>
              ))}
            </select>
          </label>

          {!selectedUserId && <p className="text-body-sm text-muted">Elige un usuario para ver su historial.</p>}

          {selectedUserId && (
            <>
              <h2 className="text-display-sm">Pickem semanal</h2>
              {userWeeklyStatus === 'pending' && <LoadingSpinner variant="inline" />}
              {userWeeklyStatus === 'error' && <p role="alert">No se pudo cargar el histórico.</p>}
              {userWeeklyWeeksOrdered.length === 0 && userWeeklyStatus === 'success' && (
                <EmptyState message="No hay partidos registrados para este usuario." />
              )}
              {userWeeklyWeeksOrdered.map((week) => (
                <div key={week.id} className={styles.weekBlock}>
                  <span className={styles.weekTitle}>{weekLabel(week)}</span>
                  <div className={`${styles.tableScroll} glass-surface`}>
                    <table className={styles.simpleTable}>
                      <tbody>
                        {userWeeklyByWeek.get(week.id)?.map((pick) => {
                          const game = gameById.get(pick.gameId)
                          const status = pickStatus(pick.pick, pick.outcome)
                          return (
                            <tr key={pick.gameId}>
                              <td>
                                <MatchupDisplay game={game} teamName={teamName} />
                              </td>
                              <td data-status={status}>
                                <TeamPick pick={pick.pick} game={game} teamName={teamName} />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <h2 className="text-display-sm">Survivor</h2>
              {userSurvivorStatus === 'pending' && <LoadingSpinner variant="inline" />}
              {userSurvivorStatus === 'error' && <p role="alert">No se pudo cargar el histórico.</p>}
              {userSurvivorWeeksOrdered.length === 0 && userSurvivorStatus === 'success' && (
                <EmptyState message="No hay semanas de survivor registradas para este usuario." />
              )}
              {userSurvivorWeeksOrdered.length > 0 && (
                <div className={`${styles.tableScroll} glass-surface`}>
                  <table className={styles.simpleTable}>
                    <tbody>
                      {userSurvivorWeeksOrdered.map((week) => {
                        const pick = userSurvivorByWeek.get(week.id)
                        return (
                          <tr key={week.id}>
                            <td className="text-muted">{weekLabel(week)}</td>
                            <td data-status={pick?.teamId ? 'pending' : 'noPick'}>
                              <span className={styles.teamPick}>
                                {pick?.teamId && <TeamBadge teamId={pick.teamId} size="sm" />}
                                {pick?.teamId ? teamName(pick.teamId) : 'Sin pick'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {mode === 'pagos' && (
        <>
          <div className={styles.filters}>
            <label>
              Quiniela
              <select
                value={paymentsQuiniela}
                onChange={(event) => {
                  setPaymentsQuiniela(event.target.value as Quiniela)
                  setPaymentsWeekId('')
                }}
              >
                <option value="weekly">Pickem semanal</option>
                <option value="survivor">Survivor</option>
              </select>
            </label>
          </div>
          {paymentsQuiniela === 'weekly' && (
            <WeekSelector activeWeekId={paymentsWeekId} onSelect={setPaymentsWeekId} allowedSegments={WEEKLY_SEGMENTS} />
          )}

          {paymentsQuiniela === 'weekly' && (
            <>
              {!paymentsWeekId && <p className="text-body-sm text-muted">Elige una semana para ver los pagos.</p>}
              {paymentsWeekId && (
                <>
                  {weeklyPaymentsStatus === 'pending' && <LoadingSpinner variant="inline" />}
                  {weeklyPaymentsStatus === 'error' && <p role="alert">No se pudieron cargar los pagos.</p>}
                  {members && members.length === 0 && weeklyPaymentsStatus === 'success' && (
                    <EmptyState message="No hay miembros en el grupo." />
                  )}
                  {members && members.length > 0 && (
                    <>
                      <p className={`text-body-sm text-muted ${styles.paymentsSummary}`}>
                        {members.filter((member) => weeklyPaidByUser.get(member.userId)).length} de {members.length}{' '}
                        pagaron esta semana.
                      </p>
                      <div className={`${styles.tableScroll} glass-surface`}>
                        <table className={styles.simpleTable}>
                          <thead>
                            <tr>
                              <th>Usuario</th>
                              <th>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {members.map((member) => {
                              const paid = weeklyPaidByUser.get(member.userId) ?? false
                              return (
                                <tr key={member.userId}>
                                  <td>{member.displayName}</td>
                                  <td>
                                    {renderPaidPill(paid, () =>
                                      handleToggleWeeklyPayment(paymentsWeekId, member.userId, !paid),
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {paymentsQuiniela === 'survivor' && (
            <>
              <p className="text-body-sm text-muted">
                La vida 1 se cobra al entrar. La vida 2 y la vida 3 solo se habilitan cuando el usuario la pidió y
                se le aprobó.
              </p>
              {(survivorPaymentsStatus === 'pending' || survivorRosterStatus === 'pending') && (
                <LoadingSpinner variant="inline" />
              )}
              {(survivorPaymentsStatus === 'error' || survivorRosterStatus === 'error') && (
                <p role="alert">No se pudieron cargar los pagos.</p>
              )}
              {survivorRoster && survivorRoster.length === 0 && survivorRosterStatus === 'success' && (
                <EmptyState message="No hay jugadores de survivor en el grupo." />
              )}
              {survivorRoster && survivorRoster.length > 0 && (
                <div className={`${styles.tableScroll} glass-surface`}>
                  <table className={styles.simpleTable}>
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Vida 1</th>
                        <th>Vida 2</th>
                        <th>Vida 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {survivorRoster.map((participant) => (
                        <tr key={participant.userId}>
                          <td>{participant.displayName}</td>
                          {SURVIVOR_LIVES.map((life) => {
                            const unlocked = participant.currentLife >= life
                            const paid = survivorPaidByUserAndLife.get(participant.userId)?.get(life) ?? false
                            return (
                              <td key={life}>
                                {unlocked ? (
                                  renderPaidPill(paid, () =>
                                    handleToggleSurvivorPayment(participant.userId, life, !paid),
                                  )
                                ) : (
                                  <span className={`text-muted ${styles.notApplicable}`}>—</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}
