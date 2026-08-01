import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDefaultGroup } from '@/presentation/hooks/useDefaultGroup'
import { useGetProfile } from '@/presentation/hooks/useGetProfile'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useListTeams } from '@/presentation/hooks/useListTeams'
import { useListMySurvivorPicks } from '@/presentation/hooks/useListMySurvivorPicks'
import { useSaveSurvivorPick } from '@/presentation/hooks/useSaveSurvivorPick'
import { useListSurvivorGroupState } from '@/presentation/hooks/useListSurvivorGroupState'
import { isPredictionLocked } from '@/core/rules/isPredictionLocked'
import { WeekSelector } from '@/presentation/components/WeekSelector/WeekSelector'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { Icon } from '@/presentation/components/Icon/Icon'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import type { Game } from '@/core/entities/catalog'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import { SurvivorLifeIndicator } from './SurvivorLifeIndicator'
import styles from './SurvivorPickPage.module.css'

interface TeamOption {
  teamId: string
  name: string
  game: Game
}

function teamOptionsForWeek(games: Game[], teamName: (id: string) => string): TeamOption[] {
  const options: TeamOption[] = []
  for (const game of games) {
    options.push({ teamId: game.homeTeamId, name: teamName(game.homeTeamId), game })
    options.push({ teamId: game.awayTeamId, name: teamName(game.awayTeamId), game })
  }
  return [...options].sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

/** Tareas 2.1-2.4 (modulo-survivor): elegir el equipo de la semana, excluyendo equipos ya usados y partidos ya iniciados; bloqueado para eliminados. */
export function SurvivorPickPage() {
  const { weekId } = useParams<{ weekId: string }>()
  const { data: group, run: loadGroup } = useDefaultGroup()
  const { data: profile, run: loadProfile } = useGetProfile()
  const { data: weeks, run: loadWeeks } = useListWeeks()
  const { status: gamesStatus, data: games, error: gamesError, run: loadGames } = useListGamesForWeek()
  const { data: teams, run: loadTeams } = useListTeams()
  const { data: myPicks, run: loadMyPicks } = useListMySurvivorPicks()
  const { data: groupState, run: loadGroupState } = useListSurvivorGroupState()
  const { status: saveStatus, run: savePick } = useSaveSurvivorPick()
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadGroup()
    loadProfile()
    loadWeeks()
    loadTeams()
  }, [loadGroup, loadProfile, loadWeeks, loadTeams])

  useEffect(() => {
    if (weekId) loadGames({ weekId })
  }, [weekId, loadGames])

  useEffect(() => {
    if (group && profile) {
      loadMyPicks({ groupId: group.id, userId: profile.userId })
      loadGroupState({ groupId: group.id })
    }
  }, [group, profile, loadMyPicks, loadGroupState])

  const teamNames = new Map((teams ?? []).map((team) => [team.id, team.name]))
  const teamName = (id: string) => teamNames.get(id) ?? id

  const activeWeek = weeks?.find((week) => week.id === weekId)
  const isRegularWeek = activeWeek?.type === 'regular'
  const myState = groupState?.find((participant) => participant.userId === profile?.userId)
  const isEliminated = myState?.status === 'eliminated'

  const usedTeamIds = new Set((myPicks ?? []).map((pick) => pick.teamId))
  const currentPick = (myPicks ?? []).find((pick) => pick.weekId === weekId) ?? null

  async function handlePick(teamId: string) {
    if (!group || !profile) return
    await savePick({ groupId: group.id, userId: profile.userId, weekId: weekId!, teamId })
    loadMyPicks({ groupId: group.id, userId: profile.userId })
  }

  if (!weekId) return null

  const normalizedSearch = search.trim().toLowerCase()
  const options = (games ? teamOptionsForWeek(games, teamName) : []).filter((option) =>
    option.name.toLowerCase().includes(normalizedSearch),
  )

  return (
    <section>
      <span className="kicker">
        <Icon name="football" size={13} /> Survivor
      </span>
      <h1 className="text-display-lg">Tu equipo de la semana</h1>
      <p className="text-body-sm text-muted">
        Elige un equipo distinto cada semana. Si pierde o empata, se consume una vida extra; si pierdes sin vidas
        disponibles, quedas eliminado.
      </p>
      {myState && (
        <p className="text-body-sm">
          Tu estado: <SurvivorLifeIndicator currentLife={myState.currentLife} />
        </p>
      )}
      <WeekSelector activeWeekId={weekId} linkTo={(id) => `/survivor/semana/${id}`} />

      {!isRegularWeek && (
        <p className="text-body-sm text-muted">Survivor solo aplica a semanas de temporada regular.</p>
      )}

      {isRegularWeek && isEliminated && (
        <EmptyState message="Ya quedaste eliminado del Survivor esta temporada. Puedes seguir viendo el estado del grupo." />
      )}

      {isRegularWeek && !isEliminated && (
        <>
          {gamesStatus === 'pending' && <p>Cargando partidos...</p>}
          {gamesError && <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />}
          {games && games.length === 0 && <EmptyState message="Esta semana todavia no tiene partidos cargados." />}

          {games && games.length > 0 && (
            <label className={styles.searchBox}>
              <Icon name="search" size={16} />
              <input
                type="search"
                placeholder="Buscar equipo..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          )}

          {games && games.length > 0 && options.length === 0 && (
            <p className="text-body-sm text-muted">Ningun equipo coincide con "{search}".</p>
          )}

          <div className={styles.grid}>
            {options.map(({ teamId, name, game }) => {
              const usedElsewhere = usedTeamIds.has(teamId) && currentPick?.teamId !== teamId
              const isSelected = currentPick?.teamId === teamId
              const locked = isPredictionLocked(game, new Date())
              const disabled = usedElsewhere || locked || saveStatus === 'pending'

              return (
                <button
                  key={teamId}
                  type="button"
                  className={styles.teamOption}
                  data-selected={isSelected}
                  disabled={disabled}
                  onClick={() => handlePick(teamId)}
                >
                  {isSelected && <Icon name="check" size={14} />}
                  <TeamBadge teamId={teamId} size="md" />
                  <span className={styles.teamName}>{name}</span>
                  {usedElsewhere && <span className={styles.tag}>Ya usado</span>}
                  {!usedElsewhere && locked && <span className={styles.tag}>Cerrado</span>}
                </button>
              )
            })}
          </div>
        </>
      )}

      {myPicks && myPicks.length > 0 && (
        <div className={styles.history}>
          <h2 className={`text-display-sm ${styles.historyTitle}`}>Tu historial</h2>
          <ul className={styles.historyList}>
            {[...myPicks]
              .sort((a, b) => (weeks?.find((w) => w.id === a.weekId)?.number ?? 0) - (weeks?.find((w) => w.id === b.weekId)?.number ?? 0))
              .map((pick) => {
                const week = weeks?.find((w) => w.id === pick.weekId)
                return (
                  <li key={pick.weekId} className={`${styles.historyRow} glass-surface`}>
                    <span className={styles.historyWeek}>{week ? weekLabel(week) : ''}</span>
                    <TeamBadge teamId={pick.teamId} size="sm" />
                    <span>{teamName(pick.teamId)}</span>
                  </li>
                )
              })}
          </ul>
        </div>
      )}
    </section>
  )
}
