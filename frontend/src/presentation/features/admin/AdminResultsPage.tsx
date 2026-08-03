import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useListTeams } from '@/presentation/hooks/useListTeams'
import { useGetGameResult } from '@/presentation/hooks/useGetGameResult'
import { useSubmitGameResult } from '@/presentation/hooks/useSubmitGameResult'
import { useListResultsForGames } from '@/presentation/hooks/useListResultsForGames'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { Icon } from '@/presentation/components/Icon/Icon'
import { Modal } from '@/presentation/components/Modal/Modal'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import type { Game } from '@/core/entities/catalog'
import type { GameOutcome, GameResult } from '@/core/entities/gameResult'
import tableStyles from '@/presentation/styles/adminTable.module.css'
import styles from './AdminResultsPage.module.css'

const OUTCOME_OPTIONS: { id: GameOutcome; label: string }[] = [
  { id: 'home', label: 'Gana local' },
  { id: 'tie', label: 'Empate' },
  { id: 'away', label: 'Gana visita' },
]

function resultLabel(result: GameResult | undefined, game: Game, teamName: (id: string) => string): string {
  if (!result) return 'Sin cargar'
  const score = result.homeScore !== null && result.awayScore !== null ? ` ${result.homeScore}-${result.awayScore}` : ''
  if (result.outcome === 'tie') return `Empate${score}`
  const winnerId = result.outcome === 'home' ? game.homeTeamId : game.awayTeamId
  return `${teamName(winnerId)}${score}`
}

function GameResultForm({
  game,
  teamName,
  onSaved,
}: {
  game: Game
  teamName: (id: string) => string
  onSaved: () => void
}) {
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
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.header}>
        <TeamBadge teamId={game.homeTeamId} size="sm" />
        <span className={styles.matchup}>
          {teamName(game.homeTeamId)} vs {teamName(game.awayTeamId)}
        </span>
        <TeamBadge teamId={game.awayTeamId} size="sm" />
      </div>
      <span className={`${styles.kickoff} text-mono-sm`}>{game.kickoffAt.toLocaleString()}</span>
      {existingResult && (
        <p className="text-body-sm text-muted">
          Origen: {existingResult.resultSource === 'manual' ? 'carga manual' : 'sincronización automatica (ESPN)'}
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
    </form>
  )
}

/** Tareas 7.1 y 7.2 (base-plataforma): registrar/editar el resultado oficial de un partido. */
export function AdminResultsPage() {
  const { data: weeks, run: loadWeeks } = useListWeeks()
  const { data: games, run: loadGames } = useListGamesForWeek()
  const { data: teams, run: loadTeams } = useListTeams()
  const { data: results, run: loadResults } = useListResultsForGames()
  const [selectedWeekId, setSelectedWeekId] = useState('')
  const [editingGame, setEditingGame] = useState<Game | null>(null)

  useEffect(() => {
    loadWeeks()
    loadTeams()
  }, [loadWeeks, loadTeams])

  useEffect(() => {
    if (selectedWeekId) loadGames({ weekId: selectedWeekId })
  }, [selectedWeekId, loadGames])

  useEffect(() => {
    if (games && games.length > 0) loadResults({ gameIds: games.map((game) => game.id) })
  }, [games, loadResults])

  const teamName = (id: string) => teams?.find((team) => team.id === id)?.name ?? id
  const resultByGameId = useMemo(() => new Map((results ?? []).map((result) => [result.gameId, result])), [results])

  function refreshResults() {
    if (games && games.length > 0) loadResults({ gameIds: games.map((game) => game.id) })
  }

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

      {selectedWeekId && games && games.length === 0 && (
        <EmptyState message="Esta semana no tiene partidos cargados." />
      )}

      {selectedWeekId && games && games.length > 0 && (
        <div className={`${tableStyles.panel} ${tableStyles.tableScroll}`}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Partido</th>
                <th>Kickoff</th>
                <th>Resultado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id}>
                  <td>
                    <span className={styles.matchupCell}>
                      <TeamBadge teamId={game.homeTeamId} size="sm" />
                      {teamName(game.homeTeamId)} <span className="text-muted">vs</span> {teamName(game.awayTeamId)}
                      <TeamBadge teamId={game.awayTeamId} size="sm" />
                    </span>
                  </td>
                  <td className="text-mono-sm">{game.kickoffAt.toLocaleString()}</td>
                  <td>{resultLabel(resultByGameId.get(game.id), game, teamName)}</td>
                  <td>
                    <span className={tableStyles.actionsCell}>
                      <button
                        type="button"
                        className={tableStyles.iconButton}
                        aria-label={`Editar resultado de ${teamName(game.homeTeamId)} vs ${teamName(game.awayTeamId)}`}
                        onClick={() => setEditingGame(game)}
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

      <Modal open={editingGame !== null} onClose={() => setEditingGame(null)}>
        {editingGame && (
          <div className="glass-surface" style={{ padding: 20 }}>
            <GameResultForm
              game={editingGame}
              teamName={teamName}
              onSaved={() => {
                refreshResults()
                setEditingGame(null)
              }}
            />
          </div>
        )}
      </Modal>
    </section>
  )
}
