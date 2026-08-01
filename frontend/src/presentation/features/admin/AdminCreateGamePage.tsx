import { useEffect, useState, type FormEvent } from 'react'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
import { useListTeams } from '@/presentation/hooks/useListTeams'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useCreateGame } from '@/presentation/hooks/useCreateGame'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './AdminCreateGamePage.module.css'

/** Panel admin: cargar el calendario de partidos (falta en la spec original de carga-resultados, que solo cubria editar resultados de partidos ya existentes). */
export function AdminCreateGamePage() {
  const { data: weeks, run: loadWeeks } = useListWeeks()
  const { data: teams, run: loadTeams } = useListTeams()
  const { data: existingGames, run: loadGames } = useListGamesForWeek()
  const { status, error, run: submitGame } = useCreateGame()

  const [weekId, setWeekId] = useState('')
  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')
  const [kickoffLocal, setKickoffLocal] = useState('')
  const [sameTeamError, setSameTeamError] = useState(false)

  useEffect(() => {
    loadWeeks()
    loadTeams()
  }, [loadWeeks, loadTeams])

  useEffect(() => {
    if (weekId) loadGames({ weekId })
  }, [weekId, loadGames])

  const teamName = (id: string) => teams?.find((team) => team.id === id)?.name ?? id

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (homeTeamId === awayTeamId) {
      setSameTeamError(true)
      return
    }
    setSameTeamError(false)
    await submitGame({ weekId, homeTeamId, awayTeamId, kickoffAt: new Date(kickoffLocal) })
    setHomeTeamId('')
    setAwayTeamId('')
    setKickoffLocal('')
    await loadGames({ weekId })
  }

  return (
    <section>
      <span className="kicker">
        <Icon name="calendar" size={13} /> Calendario
      </span>
      <h1 className="text-display-lg">Agregar partido</h1>
      <p className="text-body-sm text-muted">Carga el calendario: elige semana, equipos y fecha/hora de kickoff.</p>

      <form onSubmit={handleSubmit} className={`${styles.form} glass-surface`}>
        <label>
          Semana
          <select value={weekId} onChange={(event) => setWeekId(event.target.value)} required>
            <option value="">Selecciona una semana</option>
            {weeks?.map((week) => (
              <option key={week.id} value={week.id}>
                {week.type} {week.number}
              </option>
            ))}
          </select>
        </label>

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

        <button type="submit" disabled={status === 'pending' || !weekId}>
          {status === 'pending' ? 'Guardando...' : 'Agregar partido'}
        </button>
        {sameTeamError && <p role="alert">El equipo local y visitante no pueden ser el mismo.</p>}
        {error && <p role="alert">No se pudo guardar: {error.message}</p>}
      </form>

      {weekId && existingGames && existingGames.length > 0 && (
        <>
          <h2 className="text-display-sm">Ya cargados en esta semana</h2>
          <div className={styles.existingList}>
            {existingGames.map((game) => (
              <div key={game.id} className={`${styles.existingRow} glass-surface`}>
                <TeamBadge teamId={game.homeTeamId} size="sm" />
                <span className={styles.existingMatchup}>
                  {teamName(game.homeTeamId)} vs {teamName(game.awayTeamId)}
                </span>
                <TeamBadge teamId={game.awayTeamId} size="sm" />
                <span className={`${styles.existingKickoff} text-mono-sm`}>{game.kickoffAt.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
