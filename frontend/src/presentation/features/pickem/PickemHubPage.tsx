import { useEffect, useMemo } from 'react'
import { ActionCard } from '@/presentation/components/ActionCard/ActionCard'
import { PicksHero } from '@/presentation/features/home/PicksHero'
import { formatDeadline } from '@/presentation/features/catalog/pickSheet/PickProgress'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useNow } from '@/presentation/hooks/useNow'
import { useCanViewPickemTables } from '@/presentation/hooks/useCanViewPickemTables'
import { useListSeasonStandings } from '@/presentation/hooks/useListSeasonStandings'
import { useListWeeklyPicksForWeek } from '@/presentation/hooks/useListWeeklyPicksForWeek'
import { isWeekFullyLocked } from '@/core/rules/isWeekFullyLocked'
import { pickDefaultWeek } from '@/core/rules/pickDefaultWeek'
import { resolveTiedRanking } from '@/core/rules/resolveTiedRanking'
import { weeklyPicksBoardOpensAt } from '@/core/rules/weeklyPicksBoardOpensAt'
import styles from './PickemHubPage.module.css'

/**
 * Landing del tab "Pickem" del nav: lo de Pickem (picks, tabla, picks del
 * grupo, playoffs). Arriba va lo que hay que hacer esta semana, con su
 * cierre y progreso; abajo, accesos más chicos que dicen su estado en vez de
 * una descripción fija. Survivor no se repite aquí — tiene su propio tab.
 */
export function PickemHubPage() {
  const { profile, group, weeks, games } = useSession()
  const nowMs = useNow()
  const { data: canViewTables, run: loadCanView } = useCanViewPickemTables()
  const { data: seasonStandings, run: loadSeasonStandings } = useListSeasonStandings()
  const { data: picks, run: loadPicks } = useListWeeklyPicksForWeek()

  const activeWeek = useMemo(() => {
    if (!weeks.data || weeks.data.length === 0) return null
    return pickDefaultWeek(weeks.data, games.data ?? [], new Date())
  }, [weeks.data, games.data])

  const weekGames = useMemo(
    () => (activeWeek && games.data ? games.data.filter((game) => game.weekId === activeWeek.id) : []),
    [activeWeek, games.data],
  )

  const groupId = group.data?.id
  const userId = profile.data?.userId
  const activeWeekId = activeWeek?.id

  useEffect(() => {
    if (!groupId) return
    loadCanView({ groupId }).catch(() => undefined)
    loadSeasonStandings({ groupId }).catch(() => undefined)
  }, [groupId, loadCanView, loadSeasonStandings])

  useEffect(() => {
    if (userId && activeWeekId) loadPicks({ userId, weekId: activeWeekId }).catch(() => undefined)
  }, [userId, activeWeekId, loadPicks])

  const standingText = useMemo(() => {
    if (!userId || !canViewTables || !seasonStandings || seasonStandings.length === 0) return null
    const groups = resolveTiedRanking(seasonStandings.map((row) => ({ userId: row.userId, total: row.correctCount })))
    const mine = groups.find((rankGroup) => rankGroup.userIds.includes(userId))
    if (!mine) return null
    return `Vas ${mine.position}° de ${seasonStandings.length} con ${mine.total} ${mine.total === 1 ? 'acierto' : 'aciertos'}`
  }, [userId, canViewTables, seasonStandings])

  const boardLocked = weekGames.length > 0 && isWeekFullyLocked(weekGames, new Date(nowMs))
  const opensAt = weeklyPicksBoardOpensAt(weekGames)
  const boardDescription = boardLocked
    ? 'Compara tus picks con los del grupo'
    : opensAt
      ? `Se abren ${formatDeadline(opensAt)}, al cierre de la semana`
      : 'Compara tus picks con los del grupo, una vez que se bloquea la semana'

  const showHero = activeWeek != null && activeWeek.type !== 'playoffs' && weekGames.length > 0 && picks != null

  return (
    <section>
      <h1 className="text-display-lg">Pickem</h1>
      <p className="text-body-sm text-muted">Tus picks de la semana, la tabla y los picks del grupo.</p>

      {showHero && activeWeek && (
        <PicksHero week={activeWeek} games={weekGames} picks={picks} nowMs={nowMs} />
      )}

      <div className={styles.grid}>
        {!showHero && (
          <ActionCard
            to="/weeks"
            icon="calendar"
            title="Pickem Semanal"
            description="Predice el resultado de cada partido de la semana"
            featured
          />
        )}
        <ActionCard
          to="/pickem/tabla"
          icon="trophy"
          title="Tabla de posiciones"
          description={standingText ?? 'Quién va arriba esta semana y en la temporada'}
          compact
        />
        <ActionCard
          to="/pickem/picks"
          icon="users"
          title="Picks de todos"
          description={boardDescription}
          badge={boardLocked ? { label: 'Disponible', tone: 'active' } : { label: 'Bloqueado' }}
          compact
        />
        <ActionCard
          to="/playoffs"
          icon="trophy"
          title="Playoffs"
          description="Predice el margen de cada partido y sigue la tabla"
          compact
          wide
        />
      </div>
    </section>
  )
}
