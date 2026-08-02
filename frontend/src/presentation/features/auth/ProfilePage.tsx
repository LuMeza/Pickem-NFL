import { useEffect, useState, type FormEvent } from 'react'
import { useGetProfile } from '@/presentation/hooks/useGetProfile'
import { useUpdateDisplayName } from '@/presentation/hooks/useUpdateDisplayName'
import { useGetProfileStats } from '@/presentation/hooks/useGetProfileStats'
import { useListUserAchievements } from '@/presentation/hooks/useListUserAchievements'
import { Icon } from '@/presentation/components/Icon/Icon'
import { ActionCard } from '@/presentation/components/ActionCard/ActionCard'
import { AchievementBadge } from '@/presentation/components/AchievementBadge/AchievementBadge'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import styles from './ProfilePage.module.css'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0]![0]!
  const last = parts.length > 1 ? parts[parts.length - 1]![0]! : ''
  return (first + last).toUpperCase()
}

/** Tarea 4.5 (base-plataforma): edicion de perfil (nombre visible). */
export function ProfilePage() {
  const { status, data: profile, error, run: loadProfile } = useGetProfile()
  const { status: saveStatus, run: saveDisplayName } = useUpdateDisplayName()
  const { status: statsStatus, data: stats, run: loadStats } = useGetProfileStats()
  const { status: achievementsStatus, data: achievements, run: loadAchievements } = useListUserAchievements()
  const [displayName, setDisplayName] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadProfile()
    loadStats()
    loadAchievements()
  }, [loadProfile, loadStats, loadAchievements])

  useEffect(() => {
    if (profile) setDisplayName(profile.displayName)
  }, [profile])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaved(false)
    await saveDisplayName({ displayName })
    setSaved(true)
  }

  if (status === 'idle' || status === 'pending') return <LoadingSpinner label="Cargando perfil" />
  if (error || !profile) return <p role="alert">No se pudo cargar el perfil.</p>

  const hasStats = statsStatus === 'success' && stats !== null && stats.totalPicked > 0
  const accuracy = hasStats && stats ? Math.round((stats.totalCorrect / stats.totalPicked) * 100) : null

  return (
    <section>
      <span className="kicker">
        <Icon name="user" size={13} /> Tu cuenta
      </span>
      <h1 className="text-display-md">Mi perfil</h1>

      <div className={`${styles.hero} glass-surface`}>
        <span className={styles.avatar}>{getInitials(profile.displayName || profile.email)}</span>
        <div className={styles.heroBody}>
          <p className={styles.heroName}>{profile.displayName}</p>
          <p className={`${styles.heroEmail} text-body-sm text-muted`}>{profile.email}</p>
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
        ) : statsStatus === 'success' ? (
          <p className={`${styles.statsEmpty} text-body-sm text-muted`}>
            Todavia no tienes picks registrados en el Pickem Semanal.
          </p>
        ) : null}
      </div>

      <div className="glass-surface" style={{ padding: 24, marginTop: 16, maxWidth: 420 }}>
        <form onSubmit={handleSubmit}>
          <label>
            Nombre visible
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
          </label>
          <button type="submit" disabled={saveStatus === 'pending'}>
            {saveStatus === 'pending' ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
        {saved && saveStatus === 'success' && <p>Nombre actualizado.</p>}
      </div>

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
          title="Cambiar contrasena"
          description="Actualiza tu contrasena de acceso"
        />
        <ActionCard
          to="/pickem/acceso"
          icon="ticket"
          title="Acceso al Pickem Semanal"
          description="Solicita o revisa tu acceso a la semana actual"
        />
      </div>
    </section>
  )
}
