import { useEffect, useState, type FormEvent } from 'react'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useListTeams } from '@/presentation/hooks/useListTeams'
import { useGetGameResult } from '@/presentation/hooks/useGetGameResult'
import { useSubmitGameResult } from '@/presentation/hooks/useSubmitGameResult'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { Icon } from '@/presentation/components/Icon/Icon'
import type { Game } from '@/core/entities/catalog'
import type { GameOutcome } from '@/core/entities/gameResult'
import styles from './AdminResultsPage.module.css'

const OUTCOME_OPTIONS: { id: GameOutcome; label: string }[] = [
  { id: 'home', label: 'Gana local' },
  { id: 'tie', label: 'Empate' },
  { id: 'away', label: 'Gana visita' },
]

function GameResultForm({ game, teamName }: { game: Game; teamName: (id: string) => string }) {
  const { data: existingResult, run: loadResult } = useGetGameResult()
  const { status, error, run: submitResult } = useSubmitGameResult()
  const [outcome, setOutcome] = useState<GameOutcome>('home')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')

  useEffect(() => {
    loadResult({ gameId: game.id })
  }, [loadResult, game.id])

  useEffect(() => {
    if (existingResult) {
      setOutcome(existingResult.outcome)
      setHomeScore(existingResult.homeScore?.toString() ?? '')
      setAwayScore(existingResult.awayScore?.toString() ?? '')
    }
  }, [existingResult])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submitResult({
      gameId: game.id,
      outcome,
      homeScore: homeScore === '' ? null : Number(homeScore),
      awayScore: awayScore === '' ? null : Number(awayScore),
    })
    await loadResult({ gameId: game.id })
  }

  return (
    <form onSubmit={handleSubmit} className={`${styles.card} glass-surface`}>
      <div className={styles.header}>
        <TeamBadge teamId={game.homeTeamId} size="sm" />
        <span className={styles.matchup}>
          {teamName(game.homeTeamId)} vs {teamName(game.awayTeamId)}
        </span>
        <TeamBadge teamId={game.awayTeamId} size="sm" />
        <span className={`${styles.kickoff} text-mono-sm`}>{game.kickoffAt.toLocaleString()}</span>
      </div>
      {existingResult && (
        <p className="text-body-sm text-muted">
          Origen: {existingResult.resultSource === 'manual' ? 'carga manual' : 'sincronizacion automatica (ESPN)'}
        </p>
      )}

      <div className={styles.outcomeRow}>
        {OUTCOME_OPTIONS.map((option) => (
          <label
            key={option.id}
            className={`${styles.outcomeOption} ${outcome === option.id ? styles.outcomeOptionActive : ''}`}
          >
            <input
              type="radio"
              name={`outcome-${game.id}`}
              checked={outcome === option.id}
              onChange={() => setOutcome(option.id)}
            />
            {option.label}
          </label>
        ))}
      </div>

      <div className={styles.scoreRow}>
        <label>
          Marcador local
          <input type="number" min={0} value={homeScore} onChange={(event) => setHomeScore(event.target.value)} />
        </label>
        <label>
          Marcador visita
          <input type="number" min={0} value={awayScore} onChange={(event) => setAwayScore(event.target.value)} />
        </label>
      </div>

      <button type="submit" disabled={status === 'pending'}>
        {existingResult ? 'Corregir resultado' : 'Guardar resultado'}
      </button>
      {error && <p role="alert">No se pudo guardar: {error.message}</p>}
      {status === 'success' && <p>Guardado.</p>}
    </form>
  )
}

/** Tareas 7.1 y 7.2 (base-plataforma): registrar/editar el resultado oficial de un partido. */
export function AdminResultsPage() {
  const { data: weeks, run: loadWeeks } = useListWeeks()
  const { data: games, run: loadGames } = useListGamesForWeek()
  const { data: teams, run: loadTeams } = useListTeams()
  const [selectedWeekId, setSelectedWeekId] = useState('')
  const [teamNames] = useState(() => new Map<string, string>())

  useEffect(() => {
    loadWeeks()
    loadTeams()
  }, [loadWeeks, loadTeams])

  useEffect(() => {
    if (selectedWeekId) loadGames({ weekId: selectedWeekId })
  }, [selectedWeekId, loadGames])

  teams?.forEach((team) => teamNames.set(team.id, team.name))
  const teamName = (id: string) => teamNames.get(id) ?? id

  return (
    <section>
      <span className="kicker">
        <Icon name="trophy" size={13} /> Resultados oficiales
      </span>
      <h1 className="text-display-lg">Cargar resultados</h1>
      <label>
        Semana
        <select value={selectedWeekId} onChange={(event) => setSelectedWeekId(event.target.value)}>
          <option value="">Selecciona una semana</option>
          {weeks?.map((week) => (
            <option key={week.id} value={week.id}>
              {week.type} {week.number}
            </option>
          ))}
        </select>
      </label>
      {selectedWeekId && games && games.length === 0 && <p>Esta semana no tiene partidos cargados.</p>}
      {selectedWeekId && games?.map((game) => <GameResultForm key={game.id} game={game} teamName={teamName} />)}
    </section>
  )
}
