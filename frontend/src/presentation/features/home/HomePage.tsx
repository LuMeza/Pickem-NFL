import { useEffect, useMemo } from 'react'
import { ActionCard } from '@/presentation/components/ActionCard/ActionCard'
import { StatTile } from '@/presentation/components/StatTile/StatTile'
import { Icon } from '@/presentation/components/Icon/Icon'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useCanViewPickemTables } from '@/presentation/hooks/useCanViewPickemTables'
import { useListSeasonStandings } from '@/presentation/hooks/useListSeasonStandings'
import { useListSurvivorGroupState } from '@/presentation/hooks/useListSurvivorGroupState'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useListWeeklyPicksForWeek } from '@/presentation/hooks/useListWeeklyPicksForWeek'
import { useGetProfileStats } from '@/presentation/hooks/useGetProfileStats'
import { useListUserAchievements } from '@/presentation/hooks/useListUserAchievements'
import { pickDefaultWeek } from '@/core/rules/pickDefaultWeek'
import { resolveTiedRanking } from '@/core/rules/resolveTiedRanking'
import { isWeeklyPickLocked } from '@/core/rules/weeklyPickGroupDeadline'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import { UpcomingGamesStrip } from './UpcomingGamesStrip'
import styles from './HomePage.module.css'

/** Landing post-login — agrupada por que necesita hacer el usuario, no por orden de creación (ver design-system.md). */
export function HomePage() {
  const { profile: profileResource, group: groupResource, weeks: weeksResource, games: gamesResource } = useSession()
  const { data: profile } = profileResource
  const { data: group } = groupResource
  const { data: weeks } = weeksResource
  const { data: games } = gamesResource
  const { data: canViewTables, run: loadCanViewTables } = useCanViewPickemTables()
  const { data: seasonStandings, run: loadSeasonStandings } = useListSeasonStandings()
  const { data: survivorRoster, run: loadSurvivorRoster } = useListSurvivorGroupState()
  const { data: weekGames, run: loadWeekGames } = useListGamesForWeek()
  const { data: weeklyPicks, run: loadWeeklyPicks } = useListWeeklyPicksForWeek()
  const { status: statsStatus, data: stats, run: loadStats } = useGetProfileStats()
  const { status: achievementsStatus, data: achievements, run: loadAchievements } = useListUserAchievements()

  useEffect(() => {
    loadStats()
    loadAchievements()
  }, [loadStats, loadAchievements])

  useEffect(() => {
    if (!group) return
    loadCanViewTables({ groupId: group.id })
    loadSeasonStandings({ groupId: group.id })
    loadSurvivorRoster({ groupId: group.id })
  }, [group, loadCanViewTables, loadSeasonStandings, loadSurvivorRoster])

  const activeWeek = useMemo(() => {
    if (!weeks || weeks.length === 0) return null
    return pickDefaultWeek(weeks, games ?? [], new Date())
  }, [weeks, games])

  useEffect(() => {
    if (activeWeek) loadWeekGames({ weekId: activeWeek.id })
  }, [activeWeek, loadWeekGames])

  useEffect(() => {
    if (!group || !profile || !activeWeek) return
    loadWeeklyPicks({ userId: profile.userId, weekId: activeWeek.id })
  }, [group, profile, activeWeek, loadWeeklyPicks])

  const standingPosition = useMemo(() => {
    if (!profile || !seasonStandings || seasonStandings.length === 0) return null
    const groups = resolveTiedRanking(seasonStandings.map((row) => ({ userId: row.userId, total: row.correctCount })))
    const myGroup = groups.find((rankGroup) => rankGroup.userIds.includes(profile.userId))
    return myGroup ? { position: myGroup.position, total: myGroup.total, totalPlayers: seasonStandings.length } : null
  }, [profile, seasonStandings])

  const survivorParticipant = useMemo(() => {
    if (!profile || !survivorRoster) return null
    return survivorRoster.find((participant) => participant.userId === profile.userId) ?? null
  }, [profile, survivorRoster])

  const pendingPicksCount = useMemo(() => {
    if (!activeWeek || activeWeek.type === 'playoffs' || !weekGames || !weeklyPicks) return null
    const now = new Date()
    return weekGames.filter((game) => !isWeeklyPickLocked(weekGames, game, now) && !(game.id in weeklyPicks)).length
  }, [activeWeek, weekGames, weeklyPicks])

  const showPicksTile = activeWeek != null && activeWeek.type !== 'playoffs'

  const hasPicked = stats != null && stats.totalPicked > 0
  const hasPicksPendingResult = stats != null && stats.totalPicked === 0 && stats.totalPicksMade > 0
  const accuracy = hasPicked && stats ? Math.round((stats.totalCorrect / stats.totalPicked) * 100) : null

  const unlockedAchievements = achievements?.filter((achievement) => achievement.unlocked).length ?? null

  return (
    <section>
      <span className="kicker">
        <Icon name="football" size={13} /> Temporada regular
      </span>
      <h1 className="text-display-lg">{profile ? `Hola, ${profile.displayName}` : 'Pickem NFL'}</h1>
      <p className="text-body-sm text-muted">Tu semana arranca aquí.</p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Tu resumen</h2>
        <div className="card-grid">
          {canViewTables !== false && (
            <StatTile
              to={activeWeek ? `/pickem/tabla/${activeWeek.id}` : '/pickem/tabla'}
              icon="trophy"
              kicker="Tabla de posiciones"
              loading={!group || seasonStandings == null}
              value={standingPosition ? `${standingPosition.position}° de ${standingPosition.totalPlayers}` : 'Sin datos aún'}
              detail={standingPosition ? `${standingPosition.total} aciertos` : 'Juega tu primera semana'}
            />
          )}

          <StatTile
            to={survivorParticipant ? '/survivor/tabla' : '/survivor'}
            icon="football"
            kicker="Survivor"
            loading={!group || survivorRoster == null}
            value={
              !survivorParticipant
                ? 'Aún no juegas'
                : survivorParticipant.status === 'alive'
                  ? `Vivo · ${survivorParticipant.currentLife} vida${survivorParticipant.currentLife > 1 ? 's' : ''}`
                  : survivorParticipant.status === 'needs_life_request'
                    ? 'Necesita solicitar vida'
                    : survivorParticipant.status === 'life_request_pending'
                      ? 'Vida en revisión'
                      : 'Eliminado'
            }
            detail={survivorParticipant ? undefined : 'Elige tu equipo de la semana'}
            urgent={survivorParticipant?.status === 'needs_life_request'}
          />

          {showPicksTile && activeWeek && (
            <StatTile
              to={`/weeks/${activeWeek.id}/games`}
              icon="ticket"
              kicker={weekLabel(activeWeek)}
              loading={pendingPicksCount == null}
              value={pendingPicksCount === 0 ? '¡Al día!' : `${pendingPicksCount} sin pick`}
              urgent={pendingPicksCount != null && pendingPicksCount > 0}
            />
          )}

          <StatTile
            to="/profile"
            icon="check"
            kicker="Efectividad"
            loading={statsStatus === 'idle' || statsStatus === 'pending'}
            value={hasPicked && accuracy != null ? `${accuracy}%` : hasPicksPendingResult ? 'Pendiente' : 'Sin picks aún'}
            detail={
              hasPicked && stats
                ? `${stats.totalCorrect}/${stats.totalPicked} aciertos`
                : hasPicksPendingResult
                  ? 'Esperando resultados'
                  : 'Haz tu primer pick'
            }
          />

          <StatTile
            to="/profile"
            icon="trophy"
            kicker="Logros"
            loading={achievementsStatus === 'idle' || achievementsStatus === 'pending'}
            value={achievements ? `${unlockedAchievements} de ${achievements.length}` : 'Sin datos aún'}
            detail="Desbloqueados"
          />
        </div>
      </div>

      <UpcomingGamesStrip />

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Tu semana</h2>
        <div className="card-grid">
          <ActionCard
            to="/weeks"
            icon="calendar"
            title="Ver semanas y partidos"
            description="Entra a la semana activa y revisa las propuestas de cada partido"
            featured
          />
          <ActionCard
            to="/survivor"
            icon="football"
            title="Survivor"
            description="Elige tu equipo de la semana, sin repetir en toda la temporada"
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Tablas y resultados</h2>
        <div className="card-grid">
          <ActionCard
            to="/pickem/tabla"
            icon="trophy"
            title="Tabla de posiciones"
            description="Aciertos de la semana y acumulado de temporada"
          />
          <ActionCard
            to="/survivor/tabla"
            icon="trophy"
            title="Estado de Survivor"
            description="Quien sigue vivo, quien uso vidas extra y el podio"
          />
          <ActionCard
            to="/calendario"
            icon="calendar"
            title="Calendario completo"
            description="Todos los partidos de la temporada, de Hall of Fame a playoffs"
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Más</h2>
        <div className="card-grid">
          <ActionCard
            to="/request-access"
            icon="ticket"
            title="Acceso a otros módulos"
            description="Playoffs, cuando este disponible"
          />
          <ActionCard to="/teams" icon="football" title="Equipos" description="Catálogo completo de la NFL" />
          <ActionCard to="/profile" icon="user" title="Mi perfil" description="Edita tu nombre visible" />
        </div>
      </div>
    </section>
  )
}
