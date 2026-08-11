import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useListMySurvivorPicks } from '@/presentation/hooks/useListMySurvivorPicks'
import { useSaveSurvivorPick } from '@/presentation/hooks/useSaveSurvivorPick'
import { useListSurvivorGroupState } from '@/presentation/hooks/useListSurvivorGroupState'
import { useGetSurvivorCurrentWeek } from '@/presentation/hooks/useGetSurvivorCurrentWeek'
import { useRequestSurvivorLife } from '@/presentation/hooks/useRequestSurvivorLife'
import { useCountdown } from '@/presentation/hooks/useCountdown'
import type { SurvivorLife } from '@/core/entities/survivor'
import { isWeekAccessLocked } from '@/core/rules/isWeekAccessLocked'
import { WeekSelector } from '@/presentation/components/WeekSelector/WeekSelector'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { Icon } from '@/presentation/components/Icon/Icon'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import type { Game } from '@/core/entities/catalog'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import { SurvivorLifeIndicator } from './SurvivorLifeIndicator'
import styles from './SurvivorPickPage.module.css'

interface TeamOption {
  teamId: string
  name: string
}

function teamOptionsForWeek(games: Game[], teamName: (id: string) => string): TeamOption[] {
  const options: TeamOption[] = []
  for (const game of games) {
    options.push({ teamId: game.homeTeamId, name: teamName(game.homeTeamId) })
    options.push({ teamId: game.awayTeamId, name: teamName(game.awayTeamId) })
  }
  return [...options].sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

/** Tareas 2.1-2.4 (modulo-survivor): elegir el equipo de la semana, excluyendo equipos ya usados y partidos ya iniciados; bloqueado para eliminados. */
export function SurvivorPickPage() {
  const { weekId } = useParams<{ weekId: string }>()
  const { group: groupResource, profile: profileResource, weeks: weeksResource, teams: teamsResource } = useSession()
  const { data: group } = groupResource
  const { data: profile } = profileResource
  const { data: weeks } = weeksResource
  const { data: teams } = teamsResource
  const { status: gamesStatus, data: games, error: gamesError, run: loadGames } = useListGamesForWeek()
  const { data: myPicks, run: loadMyPicks } = useListMySurvivorPicks()
  const { data: groupState, run: loadGroupState } = useListSurvivorGroupState()
  const { status: saveStatus, error: saveError, run: savePick } = useSaveSurvivorPick()
  const { data: currentWeekNumber, run: loadCurrentWeekNumber } = useGetSurvivorCurrentWeek()
  const { status: requestLifeStatus, error: requestLifeError, run: requestLife } = useRequestSurvivorLife()
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadCurrentWeekNumber()
  }, [loadCurrentWeekNumber])

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
  const needsLifeRequest = myState?.status === 'needs_life_request'
  const lifeRequestPending = myState?.status === 'life_request_pending'
  const isWeekLocked =
    isRegularWeek && currentWeekNumber != null && (activeWeek?.number ?? 0) > currentWeekNumber

  const usedTeamIds = new Set((myPicks ?? []).map((pick) => pick.teamId))
  const currentPick = (myPicks ?? []).find((pick) => pick.weekId === weekId) ?? null

  // La seleccion de Survivor cierra para toda la semana en el kickoff mas
  // temprano (el primer partido), no partido por partido — evita elegir un
  // equipo de un partido tardio despues de ver resultados de partidos
  // anteriores de la misma semana. Mismo criterio que weekly_access.
  const pickWindowClosed = isWeekAccessLocked(games ?? [], new Date())
  const pickDeadline =
    games && games.length > 0 ? new Date(Math.min(...games.map((game) => game.kickoffAt.getTime()))) : null
  const showDeadlineCountdown = !currentPick && !pickWindowClosed && pickDeadline !== null
  const deadlineLabel = useCountdown(showDeadlineCountdown ? pickDeadline : null)

  async function handlePick(teamId: string) {
    if (!group || !profile) return
    try {
      await savePick({ groupId: group.id, userId: profile.userId, weekId: weekId!, teamId })
      loadMyPicks({ groupId: group.id, userId: profile.userId })
    } catch {
      // el error queda reflejado via saveError, ver render mas abajo
    }
  }

  async function handleRequestLife() {
    if (!group || !profile || !myState) return
    const lifeNumber = (myState.currentLife + 1) as SurvivorLife
    try {
      await requestLife({ groupId: group.id, userId: profile.userId, lifeNumber })
      loadGroupState({ groupId: group.id })
    } catch {
      // el error queda reflejado via requestLifeError, ver render mas abajo
    }
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
      <h1 className="text-display-lg">Tu equipo semanal</h1>
      <p className="text-body-sm text-muted">
        Elige un equipo distinto cada semana. Si pierde o empata, se consume una vida extra; si pierdes sin vidas
        disponibles, quedas eliminado.
      </p>
      {myState && (
        <p className="text-body-sm">
          Tu estado: <SurvivorLifeIndicator currentLife={myState.currentLife} />
        </p>
      )}
      <WeekSelector
        activeWeekId={weekId}
        linkTo={(id) => `/survivor/semana/${id}`}
        allowedSegments={['regular']}
        isWeekDisabled={(week) => week.type === 'regular' && currentWeekNumber != null && week.number > currentWeekNumber}
      />

      {!isRegularWeek && (
        <p className="text-body-sm text-muted">Survivor solo aplica a semanas de temporada regular.</p>
      )}

      {isRegularWeek && isWeekLocked && (
        <EmptyState message="Todavía no está disponible — se habilita cuando termine la semana anterior." />
      )}

      {isRegularWeek && !isWeekLocked && isEliminated && (
        <EmptyState message="Ya quedaste eliminado del Survivor esta temporada. Puedes seguir viendo el estado del grupo." />
      )}

      {isRegularWeek && !isWeekLocked && needsLifeRequest && (
        <EmptyState
          message="Perdiste con tu vida actual. Pídele una vida extra al admin para poder seguir pickeando."
          action={
            <>
              <button type="button" onClick={handleRequestLife} disabled={requestLifeStatus === 'pending'}>
                {requestLifeStatus === 'pending' ? 'Enviando...' : 'Solicitar vida extra'}
              </button>
              {requestLifeError && (
                <p className="text-body-sm" role="alert">
                  No se pudo enviar la solicitud. Intenta de nuevo.
                </p>
              )}
            </>
          }
        />
      )}

      {isRegularWeek && !isWeekLocked && !isEliminated && !needsLifeRequest && (
        <>
          {deadlineLabel && (
            <p className={styles.deadlineBanner} role="status">
              <Icon name="calendar" size={14} /> Todavía no elegiste equipo esta semana — te quedan{' '}
              <strong>{deadlineLabel}</strong> antes de que empiece el primer partido de la semana.
            </p>
          )}
          {!currentPick && pickWindowClosed && (
            <p className="text-body-sm text-muted">
              Ya cerró la selección de esta semana — no llegaste a elegir equipo.
            </p>
          )}
          {lifeRequestPending && (
            <p className="text-body-sm text-muted">
              Tu solicitud de vida extra está en revisión — puedes seguir pickeando, pero si el admin la rechaza estos
              picks no van a contar.
            </p>
          )}
          {gamesStatus === 'pending' && <LoadingSpinner variant="inline" label="Cargando partidos" />}
          {gamesError && <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />}
          {games && games.length === 0 && <EmptyState message="Esta semana todavía no tiene partidos cargados." />}

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
            <p className="text-body-sm text-muted">Ningún equipo coincide con "{search}".</p>
          )}

          {saveError && (
            <p className="text-body-sm" role="alert">
              No se pudo guardar tu pick. Intenta de nuevo.
            </p>
          )}

          <div className={styles.grid}>
            {options.map(({ teamId, name }) => {
              const usedElsewhere = usedTeamIds.has(teamId) && currentPick?.teamId !== teamId
              const isSelected = currentPick?.teamId === teamId
              const disabled = usedElsewhere || pickWindowClosed || saveStatus === 'pending'

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
                  {!usedElsewhere && pickWindowClosed && <span className={styles.tag}>Cerrado</span>}
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
