import { useEffect, useState, type FormEvent } from 'react'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useUpdateDisplayName } from '@/presentation/hooks/useUpdateDisplayName'
import { useGetProfileStats } from '@/presentation/hooks/useGetProfileStats'
import { useGetProfileWeeklyTrend } from '@/presentation/hooks/useGetProfileWeeklyTrend'
import { useListUserAchievements } from '@/presentation/hooks/useListUserAchievements'
import { Icon } from '@/presentation/components/Icon/Icon'
import { ActionCard } from '@/presentation/components/ActionCard/ActionCard'
import { AchievementBadge } from '@/presentation/components/AchievementBadge/AchievementBadge'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { WeeklyTrendChart } from './WeeklyTrendChart'
import styles from './ProfilePage.module.css'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0]![0]!
  const last = parts.length > 1 ? parts[parts.length - 1]![0]! : ''
  return (first + last).toUpperCase()
}

/** Tarea 4.5 (base-plataforma): edición de perfil (nombre visible). */
export function ProfilePage() {
  const { status, data: profile, error, reload: reloadProfile } = useSession().profile
  const { status: saveStatus, run: saveDisplayName } = useUpdateDisplayName()
  const { status: statsStatus, data: stats, run: loadStats } = useGetProfileStats()
  const { status: trendStatus, data: trend, run: loadTrend } = useGetProfileWeeklyTrend()
  const { status: achievementsStatus, data: achievements, run: loadAchievements } = useListUserAchievements()
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadStats()
    loadTrend()
    loadAchievements()
  }, [loadStats, loadTrend, loadAchievements])

  useEffect(() => {
    if (profile) setDisplayName(profile.displayName)
  }, [profile])

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

  const hasStats = statsStatus === 'success' && stats !== null && stats.totalPicked > 0
  const hasPicksPendingResult = statsStatus === 'success' && stats !== null && stats.totalPicked === 0 && stats.totalPicksMade > 0
  const accuracy = hasStats && stats ? Math.round((stats.totalCorrect / stats.totalPicked) * 100) : null
  const hasTrend = trendStatus === 'success' && trend !== null && trend.length > 0

  return (
    <section>
      <span className="kicker">
        <Icon name="user" size={13} /> Tu cuenta
      </span>
      <h1 className="text-display-md">Mi perfil</h1>

      <div className={`${styles.hero} glass-surface`}>
        <span className={styles.avatarRing}>
          <span className={styles.avatar}>{getInitials(profile.displayName || profile.email)}</span>
        </span>
        <div className={styles.heroBody}>
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
            <p className={styles.heroName}>
              {profile.displayName}
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
          <p className={`${styles.heroEmail} text-body-sm text-muted`}>{profile.email}</p>
          {saved && saveStatus === 'success' && !editingName && (
            <p className={`${styles.savedHint} text-body-sm`}>Nombre actualizado.</p>
          )}
        </div>

        {hasStats && stats ? (
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.totalCorrect}</span>
              <span className={styles.statLabel}>Aciertos</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{accuracy}%</span>
              <span className={styles.statLabel}>Efectividad</span>
            </div>
          </div>
        ) : hasPicksPendingResult ? (
          <p className={`${styles.statsEmpty} text-body-sm text-muted`}>
            Ya hiciste tus picks de esta semana — tu efectividad se calcula en cuanto terminen esos partidos.
          </p>
        ) : statsStatus === 'success' ? (
          <p className={`${styles.statsEmpty} text-body-sm text-muted`}>
            Todavía no tienes picks registrados en el Pickem Semanal.
          </p>
        ) : null}
      </div>

      <h2 className={`text-display-sm ${styles.sectionTitle}`}>
        <Icon name="trendUp" size={20} className={styles.sectionIcon} /> Tendencia reciente
      </h2>
      {trendStatus === 'idle' || trendStatus === 'pending' ? (
        <LoadingSpinner variant="inline" label="Cargando tendencia" />
      ) : trendStatus === 'error' ? (
        <p role="alert">No pudimos cargar tu tendencia reciente.</p>
      ) : hasTrend && trend ? (
        <div className={`${styles.trendCard} glass-surface`}>
          <WeeklyTrendChart points={trend} />
        </div>
      ) : (
        <p className="text-body-sm text-muted">Todavía no hay semanas con resultados para mostrar tu tendencia.</p>
      )}

      <h2 className={`text-display-sm ${styles.sectionTitle}`}>
        <Icon name="trophy" size={20} className={styles.sectionIcon} /> Logros
      </h2>
      {achievementsStatus === 'idle' || achievementsStatus === 'pending' ? (
        <LoadingSpinner variant="inline" label="Cargando logros" />
      ) : achievementsStatus === 'error' ? (
        <p role="alert">No pudimos cargar tus logros.</p>
      ) : (
        <div className={styles.achievementsGrid}>
          {achievements?.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              title={achievement.title}
              description={achievement.description}
              unlocked={achievement.unlocked}
            />
          ))}
        </div>
      )}

      <h2 className={`text-display-sm ${styles.sectionTitle}`}>Accesos rapidos</h2>
      <div className="card-grid">
        <ActionCard
          to="/change-password"
          icon="lock"
          title="Cambiar contraseña"
          description="Actualiza tu contraseña de acceso"
        />
        <ActionCard
          to="/weeks"
          icon="calendar"
          title="Pickem Semanal"
          description="Mira los partidos de la semana y haz tus picks"
        />
      </div>
    </section>
  )
}
