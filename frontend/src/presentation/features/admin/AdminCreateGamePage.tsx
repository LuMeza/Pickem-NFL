import { useEffect, useState, type FormEvent } from 'react'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useCreateGame } from '@/presentation/hooks/useCreateGame'
import { useUpdateGame } from '@/presentation/hooks/useUpdateGame'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { Icon } from '@/presentation/components/Icon/Icon'
import { Modal } from '@/presentation/components/Modal/Modal'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import type { Game } from '@/core/entities/catalog'
import tableStyles from '@/presentation/styles/adminTable.module.css'
import styles from './AdminCreateGamePage.module.css'

type FormModalState = { mode: 'create' } | { mode: 'edit'; game: Game } | null

function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Panel admin: cargar y corregir el calendario de partidos (falta en la spec original de carga-resultados, que solo cubria editar resultados de partidos ya existentes). */
export function AdminCreateGamePage() {
  const { weeks: weeksResource, teams: teamsResource, games: gamesResource } = useSession()
  const { data: weeks } = weeksResource
  const { data: teams } = teamsResource
  const { data: existingGames, run: loadGames } = useListGamesForWeek()
  const { status: createStatus, error: createError, run: submitGame } = useCreateGame()
  const { status: updateStatus, error: updateError, run: runUpdateGame } = useUpdateGame()

  const [weekId, setWeekId] = useState('')
  const [formModal, setFormModal] = useState<FormModalState>(null)
  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')
  const [kickoffLocal, setKickoffLocal] = useState('')
  const [sameTeamError, setSameTeamError] = useState(false)

  useEffect(() => {
    if (weekId) loadGames({ weekId })
  }, [weekId, loadGames])

  useEffect(() => {
    if (!formModal) return
    setSameTeamError(false)
    if (formModal.mode === 'edit') {
      setHomeTeamId(formModal.game.homeTeamId)
      setAwayTeamId(formModal.game.awayTeamId)
      setKickoffLocal(toDatetimeLocalValue(formModal.game.kickoffAt))
    } else {
      setHomeTeamId('')
      setAwayTeamId('')
      setKickoffLocal('')
    }
  }, [formModal])

  const teamName = (id: string) => teams?.find((team) => team.id === id)?.name ?? id
  const status = formModal?.mode === 'edit' ? updateStatus : createStatus
  const error = formModal?.mode === 'edit' ? updateError : createError

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (homeTeamId === awayTeamId) {
      setSameTeamError(true)
      return
    }
    setSameTeamError(false)
    if (formModal?.mode === 'edit') {
      await runUpdateGame({
        gameId: formModal.game.id,
        changes: { homeTeamId, awayTeamId, kickoffAt: new Date(kickoffLocal) },
      })
    } else {
      await submitGame({ weekId, homeTeamId, awayTeamId, kickoffAt: new Date(kickoffLocal) })
    }
    setFormModal(null)
    await loadGames({ weekId })
    gamesResource.reload()
  }

  return (
    <section>
      <span className="kicker">
        <Icon name="calendar" size={13} /> Calendario
      </span>
      <h1 className="text-display-lg">Partidos</h1>
      <p className="text-body-sm text-muted">Elige una semana para ver sus partidos y cargar el calendario.</p>

      <div className={styles.header}>
        <label className={styles.weekField}>
          Semana
          <select value={weekId} onChange={(event) => setWeekId(event.target.value)}>
            <option value="">Selecciona una semana</option>
            {weeks?.map((week) => (
              <option key={week.id} value={week.id}>
                {weekLabel(week)}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setFormModal({ mode: 'create' })} disabled={!weekId}>
          Agregar partido
        </button>
      </div>

      {!weekId && <p className="text-body-sm text-muted">Elige una semana para ver sus partidos.</p>}
      {weekId && existingGames && existingGames.length === 0 && (
        <EmptyState message="Esta semana todavía no tiene partidos cargados." />
      )}
      {weekId && existingGames && existingGames.length > 0 && (
        <div className={`${tableStyles.panel} ${tableStyles.tableScroll}`}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Local</th>
                <th>Visitante</th>
                <th>Kickoff</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {existingGames.map((game) => (
                <tr key={game.id}>
                  <td>
                    <span className={styles.matchupCell}>
                      <TeamBadge teamId={game.homeTeamId} size="sm" />
                      {teamName(game.homeTeamId)}
                    </span>
                  </td>
                  <td>
                    <span className={styles.matchupCell}>
                      <TeamBadge teamId={game.awayTeamId} size="sm" />
                      {teamName(game.awayTeamId)}
                    </span>
                  </td>
                  <td className="text-mono-sm">{game.kickoffAt.toLocaleString()}</td>
                  <td>
                    <span className={tableStyles.actionsCell}>
                      <button
                        type="button"
                        className={tableStyles.iconButton}
                        aria-label={`Editar ${teamName(game.homeTeamId)} vs ${teamName(game.awayTeamId)}`}
                        onClick={() => setFormModal({ mode: 'edit', game })}
                      >
                        <Icon name="edit" size={16} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={formModal !== null} onClose={() => setFormModal(null)}>
        <div className="glass-surface" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="text-display-sm">{formModal?.mode === 'edit' ? 'Editar partido' : 'Agregar partido'}</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.teamsRow}>
              <label>
                Equipo local
                <select value={homeTeamId} onChange={(event) => setHomeTeamId(event.target.value)} required>
                  <option value="">Selecciona</option>
                  {teams?.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Equipo visitante
                <select value={awayTeamId} onChange={(event) => setAwayTeamId(event.target.value)} required>
                  <option value="">Selecciona</option>
                  {teams?.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Kickoff
              <input
                type="datetime-local"
                value={kickoffLocal}
                onChange={(event) => setKickoffLocal(event.target.value)}
                required
              />
            </label>

            {sameTeamError && <p role="alert">El equipo local y visitante no pueden ser el mismo.</p>}
            {error && <p role="alert">No se pudo guardar: {error.message}</p>}
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={status === 'pending'}>
                {status === 'pending' ? 'Guardando...' : formModal?.mode === 'edit' ? 'Guardar cambios' : 'Agregar partido'}
              </button>
              <button type="button" className="button-secondary" onClick={() => setFormModal(null)}>
                Cancelar
              </button>
            </span>
          </form>
        </div>
      </Modal>
    </section>
  )
}
