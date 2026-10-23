import { useEffect, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useCheckPlatformAdmin } from '@/presentation/hooks/useCheckPlatformAdmin'
import { useCanViewPickemTables } from '@/presentation/hooks/useCanViewPickemTables'
import { useListSeasonStandings } from '@/presentation/hooks/useListSeasonStandings'
import { useListSurvivorGroupState } from '@/presentation/hooks/useListSurvivorGroupState'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useListWeeklyPicksForWeek } from '@/presentation/hooks/useListWeeklyPicksForWeek'
import { useGetProfileStats } from '@/presentation/hooks/useGetProfileStats'
import { useListUserAchievements } from '@/presentation/hooks/useListUserAchievements'
import { pickDefaultWeek } from '@/core/rules/pickDefaultWeek'
import { resolveTiedRanking } from '@/core/rules/resolveTiedRanking'
import { UpcomingGamesStrip } from './UpcomingGamesStrip'
import { PicksHero } from './PicksHero'
import { useNow } from '@/presentation/hooks/useNow'
import styles from './HomePage.module.css'

/**
 * Landing post-login — jerarquía por frecuencia de decisión, no por lista de
 * rutas: acción pendiente de la semana (único elemento con peso visual) >
 * tu temporada (posición, Survivor, desempeño, en renglones planos) >
 * próximos partidos > accesos secundarios. Pickem/Survivor/Calendario/Perfil
 * ya viven en el NavBar, así que Inicio no los repite como tarjetas.
 */
export function HomePage() {
  const { profile: profileResource, group: groupResource, weeks: weeksResource, games: gamesResource } = useSession()
  const { data: profile } = profileResource
  const { data: group } = groupResource
  const { data: weeks } = weeksResource
  const { data: games } = gamesResource
  const { data: canViewTables, run: loadCanViewTables } = useCanViewPickemTables()
  const { data: isPlatformAdmin, run: checkPlatformAdmin } = useCheckPlatformAdmin()
  const { data: seasonStandings, run: loadSeasonStandings } = useListSeasonStandings()
  const { data: survivorRoster, run: loadSurvivorRoster } = useListSurvivorGroupState()
  const { data: weekGames, run: loadWeekGames } = useListGamesForWeek()
  const { data: weeklyPicks, run: loadWeeklyPicks } = useListWeeklyPicksForWeek()
  const { status: statsStatus, data: stats, run: loadStats } = useGetProfileStats()
  const { status: achievementsStatus, data: achievements, run: loadAchievements } = useListUserAchievements()
  const nowMs = useNow()

  useEffect(() => {
    loadStats()
    loadAchievements()
    checkPlatformAdmin()
  }, [loadStats, loadAchievements, checkPlatformAdmin])

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

  const myStreak = useMemo(() => {
    if (!profile || !seasonStandings) return 0
    return seasonStandings.find((row) => row.userId === profile.userId)?.currentStreak ?? 0
  }, [profile, seasonStandings])

  const survivorParticipant = useMemo(() => {
    if (!profile || !survivorRoster) return null
    return survivorRoster.find((participant) => participant.userId === profile.userId) ?? null
  }, [profile, survivorRoster])

  const survivorReviveWeekNumber = weeks?.find((week) => week.id === survivorParticipant?.revivalDeadlineWeekId)?.number

  const showPicksTile = activeWeek != null && activeWeek.type !== 'playoffs'

  const hasPicked = stats != null && stats.totalPicked > 0
  const hasPicksPendingResult = stats != null && stats.totalPicked === 0 && stats.totalPicksMade > 0
  const accuracy = hasPicked && stats ? Math.round((stats.totalCorrect / stats.totalPicked) * 100) : null

  const unlockedAchievements = achievements?.filter((achievement) => achievement.unlocked).length ?? null

  const survivorValue = !survivorParticipant
    ? 'Aún no juegas'
    : survivorParticipant.status === 'alive'
      ? `Vivo, vida ${survivorParticipant.currentLife} de 3`
      : survivorParticipant.revivalDeadlineWeekId
        ? 'Puedes revivir'
        : 'Eliminado'
  const survivorDetail = !survivorParticipant
    ? 'Elige tu equipo de la semana'
    : survivorParticipant.status === 'alive'
      ? 'Revisa tu pick de la semana'
      : survivorParticipant.revivalDeadlineWeekId
        ? `Elige equipo en la semana ${survivorReviveWeekNumber ?? 'siguiente'} antes del primer partido`
        : 'Sigue la tabla del grupo'

  const statsLoading = statsStatus === 'idle' || statsStatus === 'pending'
  const achievementsLoading = achievementsStatus === 'idle' || achievementsStatus === 'pending'

  return (
    <section>
      <h1 className={styles.greeting}>{profile ? `Hola, ${profile.displayName}` : 'Pickem NFL'}</h1>

      {showPicksTile && activeWeek && weekGames && weeklyPicks && weekGames.length > 0 && (
        <PicksHero week={activeWeek} games={weekGames} picks={weeklyPicks} nowMs={nowMs} />
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Tu temporada</h2>
        <ul className={styles.seasonList}>
          {canViewTables !== false && (
            <SeasonRow
              to={activeWeek ? `/pickem/tabla/${activeWeek.id}` : '/pickem/tabla'}
              label="Posición"
              loading={!group || seasonStandings == null}
              value={
                standingPosition ? (
                  <>
                    {standingPosition.position}°
                    <span className={styles.seasonValueSoft}> de {standingPosition.totalPlayers}</span>
                  </>
                ) : isPlatformAdmin ? (
                  'No participas'
                ) : (
                  'Sin datos aún'
                )
              }
              detail={
                standingPosition
                  ? `${standingPosition.total} ${standingPosition.total === 1 ? 'acierto' : 'aciertos'}${myStreak >= 3 ? `, racha de ${myStreak} 🔥` : ''}`
                  : isPlatformAdmin
                    ? 'Los admins no aparecen en el ranking'
                    : 'Juega tu primera semana'
              }
            />
          )}
          <SeasonRow
            to={survivorParticipant ? '/survivor/tabla' : '/survivor'}
            label="Survivor"
            loading={!group || survivorRoster == null}
            value={survivorValue}
            detail={survivorDetail}
          />
          <SeasonRow
            to="/profile"
            label="Efectividad"
            loading={statsLoading}
            value={hasPicked && accuracy != null ? `${accuracy}%` : hasPicksPendingResult ? 'Pendiente' : 'Sin picks aún'}
            detail={
              hasPicked && stats
                ? `${stats.totalCorrect} de ${stats.totalPicked} aciertos`
                : hasPicksPendingResult
                  ? 'Esperando resultados'
                  : 'Haz tu primer pick'
            }
          />
          <SeasonRow
            to="/profile"
            label="Logros"
            loading={achievementsLoading}
            value={achievements ? `${unlockedAchievements} de ${achievements.length}` : 'Sin datos aún'}
            detail="Desbloqueados"
          />
        </ul>
      </div>

      <UpcomingGamesStrip />

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Explorar</h2>
        <div className={styles.exploreLinks}>
          <Link to="/teams" className={styles.exploreLink}>
            <Icon name="football" size={15} /> Equipos
          </Link>
          <Link to="/request-access" className={styles.exploreLink}>
            <Icon name="lock" size={15} /> Acceso a otros módulos
          </Link>
        </div>
      </div>
    </section>
  )
}

/**
 * Renglón de "Tu temporada": dato en display + contexto en texto. Sin tarjeta
 * a propósito — solo el hero de picks lleva superficie; esto informa, no pide.
 */
function SeasonRow({
  to,
  label,
  value,
  detail,
  loading,
}: {
  to: string
  label: string
  value: ReactNode
  detail: string
  loading: boolean
}) {
  return (
    <li>
      <Link to={to} className={styles.seasonRow}>
        <span className={styles.seasonLabel}>{label}</span>
        {loading ? (
          <LoadingSpinner variant="inline" />
        ) : (
          <>
            <span className={styles.seasonValue}>{value}</span>
            <span className={styles.seasonDetail}>{detail}</span>
          </>
        )}
        <Icon name="chevronRight" size={16} className={styles.seasonChevron} />
      </Link>
    </li>
  )
}
