import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useUpdateDisplayName } from '@/presentation/hooks/useUpdateDisplayName'
import { useGetProfileStats } from '@/presentation/hooks/useGetProfileStats'
import { useGetProfileWeeklyTrend } from '@/presentation/hooks/useGetProfileWeeklyTrend'
import { useListUserAchievements } from '@/presentation/hooks/useListUserAchievements'
import { useListSeasonStandings } from '@/presentation/hooks/useListSeasonStandings'
import { useCheckPlatformAdmin } from '@/presentation/hooks/useCheckPlatformAdmin'
import { getInitials } from '@/core/rules/getInitials'
import { pickDefaultWeek } from '@/core/rules/pickDefaultWeek'
import { resolveTiedRanking } from '@/core/rules/resolveTiedRanking'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { SeasonRail } from './SeasonRail'
import { TrophyCase } from './TrophyCase'
import styles from './ProfilePage.module.css'

interface PlayerStat {
  label: string
  value: string
  detail: string
}

/**
 * Perfil como tarjeta de jugador: quién eres, cómo vas en la temporada
 * (lugar, efectividad, racha, mejor semana) y el riel con cada semana; al
 * lado, la vitrina de logros.
 */
export function ProfilePage() {
  const session = useSession()
  const { status, data: profile, error, reload: reloadProfile } = session.profile
  const { data: group } = session.group
  const { data: weeks } = session.weeks
  const { data: games } = session.games
  const { status: saveStatus, run: saveDisplayName } = useUpdateDisplayName()
  const { status: statsStatus, data: stats, run: loadStats } = useGetProfileStats()
  const { status: trendStatus, data: trend, run: loadTrend } = useGetProfileWeeklyTrend()
  const { status: achievementsStatus, data: achievements, run: loadAchievements } = useListUserAchievements()
  const { data: seasonStandings, run: loadSeasonStandings } = useListSeasonStandings()
  const { data: isPlatformAdmin, run: checkPlatformAdmin } = useCheckPlatformAdmin()
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadStats()
    loadTrend()
    loadAchievements()
    checkPlatformAdmin()
  }, [loadStats, loadTrend, loadAchievements, checkPlatformAdmin])

  useEffect(() => {
    if (group) loadSeasonStandings({ groupId: group.id })
  }, [group, loadSeasonStandings])

  useEffect(() => {
    if (profile) setDisplayName(profile.displayName)
  }, [profile])

  const currentWeek = useMemo(() => {
    if (!weeks || weeks.length === 0) return null
    return pickDefaultWeek(weeks, games ?? [], new Date())
  }, [weeks, games])

  const myStanding = useMemo(() => {
    if (!profile || !seasonStandings || seasonStandings.length === 0) return null
    const ranking = resolveTiedRanking(seasonStandings.map((row) => ({ userId: row.userId, total: row.correctCount })))
    const mine = ranking.find((rankGroup) => rankGroup.userIds.includes(profile.userId))
    const row = seasonStandings.find((standing) => standing.userId === profile.userId)
    return mine && row ? { position: mine.position, players: seasonStandings.length, streak: row.currentStreak } : null
  }, [profile, seasonStandings])

  function startEditingName() {
    setSaved(false)
    setEditingName(true)
  }

  function cancelEditingName() {
    if (profile) setDisplayName(profile.displayName)
    setEditingName(false)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaved(false)
    await saveDisplayName({ displayName })
    reloadProfile()
    setSaved(true)
    setEditingName(false)
  }

  if (status === 'idle' || status === 'pending') return <LoadingSpinner label="Cargando perfil" />
  if (error || !profile) return <p role="alert">No se pudo cargar el perfil.</p>

  const hasResults = statsStatus === 'success' && stats !== null && stats.totalPicked > 0
  const accuracy = hasResults && stats ? Math.round((stats.totalCorrect / stats.totalPicked) * 100) : null
  const bestWeek =
    trend && trend.length > 0
      ? trend.reduce((best, point) =>
          point.totalCorrect > best.totalCorrect ||
          (point.totalCorrect === best.totalCorrect && point.totalPicked < best.totalPicked)
            ? point
            : best,
        )
      : null
  const notRanked = isPlatformAdmin ? 'No participas' : 'Sin datos aún'

  const playerStats: PlayerStat[] = [
    {
      label: 'Lugar',
      value: myStanding ? `${myStanding.position}°` : '—',
      detail: myStanding ? `de ${myStanding.players} jugadores` : notRanked,
    },
    {
      label: 'Efectividad',
      value: accuracy !== null ? `${accuracy}%` : '—',
      detail: hasResults && stats ? `acertaste ${stats.totalCorrect} de ${stats.totalPicked}` : 'Sin resultados aún',
    },
    {
      label: 'Racha',
      value: myStanding ? `${myStanding.streak}` : '—',
      detail: myStanding ? (myStanding.streak === 1 ? 'acierto seguido' : 'aciertos seguidos') : notRanked,
    },
    {
      label: 'Mejor semana',
      value: bestWeek ? `${bestWeek.totalCorrect}/${bestWeek.totalPicked}` : '—',
      detail: bestWeek ? weekLabel({ type: bestWeek.weekType, number: bestWeek.weekNumber }) : 'Sin resultados aún',
    },
  ]

  const pendingResults =
    statsStatus === 'success' && stats !== null && stats.totalPicked === 0 && stats.totalPicksMade > 0

  return (
    <section>
      <span className="kicker">
        <Icon name="user" size={13} /> Tu cuenta
      </span>
      <h1 className="text-display-md">Mi perfil</h1>

      <div className={styles.layout}>
        <div className={`${styles.card} glass-surface`}>
          <div className={styles.identity}>
            <span className={styles.avatarRing}>
              <span className={styles.avatar}>{getInitials(profile.displayName || profile.email)}</span>
            </span>
            <div className={styles.identityBody}>
              {editingName ? (
                <form className={styles.nameForm} onSubmit={handleSubmit}>
                  <input
                    className={styles.nameInput}
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    aria-label="Nombre visible"
                    autoFocus
                    required
                  />
                  <button type="submit" className={styles.nameSaveButton} disabled={saveStatus === 'pending'}>
                    {saveStatus === 'pending' ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" className="button-secondary" onClick={cancelEditingName}>
                    Cancelar
                  </button>
                </form>
              ) : (
                <p className={styles.name}>
                  <span className={styles.nameText}>{profile.displayName}</span>
                  <button
                    type="button"
                    className={styles.editNameButton}
                    aria-label="Editar nombre visible"
                    onClick={startEditingName}
                  >
                    <Icon name="edit" size={14} />
                  </button>
                </p>
              )}
              <p className={styles.email}>{profile.email}</p>
              {saved && saveStatus === 'success' && !editingName && (
                <p className={styles.savedHint}>Nombre actualizado.</p>
              )}
            </div>
            <Link to="/change-password" className={styles.passwordLink}>
              <Icon name="lock" size={13} /> Cambiar contraseña
            </Link>
          </div>

          <dl className={styles.stats}>
            {playerStats.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <dt className={styles.statLabel}>{stat.label}</dt>
                <dd className={styles.statValue}>{stat.value}</dd>
                <dd className={styles.statDetail}>{stat.detail}</dd>
              </div>
            ))}
          </dl>
          {pendingResults && (
            <p className={styles.pendingHint}>
              Ya hiciste picks: tu efectividad aparece en cuanto terminen esos partidos.
            </p>
          )}

          <div className={styles.season}>
            <h2 className={styles.seasonTitle}>Tu temporada</h2>
            {trendStatus === 'error' ? (
              <p role="alert" className={styles.pendingHint}>
                No pudimos cargar tus semanas.
              </p>
            ) : weeks && trendStatus === 'success' ? (
              <SeasonRail weeks={weeks.filter((week) => week.type !== 'hof')} points={trend ?? []} currentWeekId={currentWeek?.id ?? null} />
            ) : (
              <LoadingSpinner variant="inline" label="Cargando temporada" />
            )}
          </div>
        </div>

        <aside className={styles.side}>
          {achievementsStatus === 'error' ? (
            <p role="alert">No pudimos cargar tus logros.</p>
          ) : achievements && achievementsStatus === 'success' ? (
            <TrophyCase achievements={achievements} />
          ) : (
            <LoadingSpinner variant="inline" label="Cargando logros" />
          )}
        </aside>
      </div>
    </section>
  )
}
