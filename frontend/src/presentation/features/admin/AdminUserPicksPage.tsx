import { useEffect, useState } from 'react'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListGroupMembers } from '@/presentation/hooks/useListGroupMembers'
import { useListAdminWeeklyPicksForWeek } from '@/presentation/hooks/useListAdminWeeklyPicksForWeek'
import { useListAdminSurvivorPicksForWeek } from '@/presentation/hooks/useListAdminSurvivorPicksForWeek'
import { useListAdminWeeklyPicksForUser } from '@/presentation/hooks/useListAdminWeeklyPicksForUser'
import { useListAdminSurvivorPicksForUser } from '@/presentation/hooks/useListAdminSurvivorPicksForUser'
import { Icon } from '@/presentation/components/Icon/Icon'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { weekLabel as formatWeekLabel } from '@/presentation/features/pickem/weekLabel'
import type { Game, Week } from '@/core/entities/catalog'
import type { AdminUserWeeklyPick, AdminWeeklyPickRow } from '@/core/ports/AdminPicksRepository'
import styles from './AdminUserPicksPage.module.css'

type Mode = 'porSemana' | 'porUsuario'
type Quiniela = 'weekly' | 'survivor'
type PickStatus = 'correct' | 'incorrect' | 'pending' | 'noPick'

function weekLabel(week: Week | undefined): string {
  return week ? formatWeekLabel(week) : ''
}

function pickStatus(pick: string | null, outcome: string | null): PickStatus {
  if (pick === null) return 'noPick'
  if (outcome === null) return 'pending'
  return pick === outcome ? 'correct' : 'incorrect'
}

function pickedTeamId(pick: string | null, game: Game | undefined): string | null {
  if (pick === null || pick === 'tie' || !game) return null
  return pick === 'home' ? game.homeTeamId : game.awayTeamId
}

function pickLabel(pick: string | null, game: Game | undefined, teamName: (id: string) => string): string {
  if (pick === null) return 'Sin pick'
  if (pick === 'tie') return 'Empate'
  if (!game) return pick
  return teamName(pick === 'home' ? game.homeTeamId : game.awayTeamId)
}

function matchupTitle(game: Game | undefined, teamName: (id: string) => string): string {
  if (!game) return 'Partido no encontrado'
  return `${teamName(game.homeTeamId)} vs ${teamName(game.awayTeamId)}`
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

  useEffect(() => {
    if (group) loadMembers({ groupId: group.id })
  }, [group, loadMembers])

  useEffect(() => {
    if (!group || mode !== 'porSemana' || !selectedWeekId) return
    if (quiniela === 'weekly') loadWeeklyForWeek({ groupId: group.id, weekId: selectedWeekId })
    else loadSurvivorForWeek({ groupId: group.id, weekId: selectedWeekId })
  }, [group, mode, quiniela, selectedWeekId, loadWeeklyForWeek, loadSurvivorForWeek])

  useEffect(() => {
    if (!group || mode !== 'porUsuario' || !selectedUserId) return
    loadUserWeekly({ groupId: group.id, userId: selectedUserId })
    loadUserSurvivor({ groupId: group.id, userId: selectedUserId })
  }, [group, mode, selectedUserId, loadUserWeekly, loadUserSurvivor])

  const teamName = (id: string) => teams?.find((team) => team.id === id)?.name ?? id
  const gameById = new Map((games ?? []).map((game) => [game.id, game]))
  const orderedWeeks = weeks ?? []

  const weekOptions = orderedWeeks.filter((week) =>
    quiniela === 'weekly' ? week.type !== 'playoffs' : week.type === 'regular',
  )

  const gamesForSelectedWeek = (games ?? [])
    .filter((game) => game.weekId === selectedWeekId)
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())

  const weeklyByUser = new Map<string, { displayName: string; rowsByGame: Map<string, AdminWeeklyPickRow> }>()
  weeklyWeekRows?.forEach((row) => {
    const entry = weeklyByUser.get(row.userId) ?? { displayName: row.displayName, rowsByGame: new Map() }
    entry.rowsByGame.set(row.gameId, row)
    weeklyByUser.set(row.userId, entry)
  })

  const userWeeklyByWeek = new Map<string, AdminUserWeeklyPick[]>()
  userWeeklyPicks?.forEach((pick) => {
    const list = userWeeklyByWeek.get(pick.weekId) ?? []
    list.push(pick)
    userWeeklyByWeek.set(pick.weekId, list)
  })
  const userWeeklyWeeksOrdered = orderedWeeks.filter((week) => userWeeklyByWeek.has(week.id))

  const userSurvivorByWeek = new Map((userSurvivorPicks ?? []).map((pick) => [pick.weekId, pick]))
  const userSurvivorWeeksOrdered = orderedWeeks.filter((week) => userSurvivorByWeek.has(week.id))

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
            <label>
              Semana
              <select value={selectedWeekId} onChange={(event) => setSelectedWeekId(event.target.value)}>
                <option value="">Selecciona una semana</option>
                {weekOptions.map((week) => (
                  <option key={week.id} value={week.id}>
                    {weekLabel(week)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!selectedWeekId && <p className="text-body-sm text-muted">Elige una semana para ver los picks.</p>}

          {selectedWeekId && quiniela === 'weekly' && (
            <>
              {weeklyWeekStatus === 'pending' && <LoadingSpinner variant="inline" />}
              {weeklyWeekStatus === 'error' && <p role="alert">No se pudieron cargar los picks.</p>}
              {weeklyByUser.size === 0 && weeklyWeekStatus === 'success' && (
                <EmptyState message="Nadie tiene picks para esta semana." />
              )}
              {weeklyByUser.size > 0 && (
                <div className={`${styles.tableScroll} glass-surface`}>
                  <table className={styles.matrixTable}>
                    <thead>
                      <tr>
                        <th className={styles.userHeaderCell}>Usuario</th>
                        {gamesForSelectedWeek.map((game) => (
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
                      {[...weeklyByUser.entries()].map(([userId, entry]) => (
                        <tr key={userId}>
                          <td className={styles.userHeaderCell}>{entry.displayName}</td>
                          {gamesForSelectedWeek.map((game) => {
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
                      {survivorWeekRows.map((row) => (
                        <tr key={row.userId}>
                          <td>{row.displayName}</td>
                          <td data-status={row.teamId ? 'pending' : 'noPick'}>
                            <span className={styles.teamPick}>
                              {row.teamId && <TeamBadge teamId={row.teamId} size="sm" />}
                              {row.teamId ? teamName(row.teamId) : 'Sin pick'}
                            </span>
                          </td>
                          <td>{row.lifeNumber ?? '—'}</td>
                          <td>{row.status === 'eliminated' ? 'Eliminado' : 'Vivo'}</td>
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
    </section>
  )
}
