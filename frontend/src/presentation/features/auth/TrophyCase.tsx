import type { ProfileAchievement } from '@/core/entities/achievement'
import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './TrophyCase.module.css'

function formatUnlockedAt(date: Date): string {
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '')
}

/**
 * Vitrina de logros: los ganados primero, en medalla plateada (el plateado
 * está reservado para logros/ranking, ver doc/design-system.md); los que
 * faltan después, como siluetas compactas que dicen cómo conseguirlos.
 */
export function TrophyCase({ achievements }: { achievements: ProfileAchievement[] }) {
  const unlocked = achievements
    .filter((achievement) => achievement.unlocked)
    .sort((a, b) => (a.unlockedAt?.getTime() ?? 0) - (b.unlockedAt?.getTime() ?? 0))
  const locked = achievements.filter((achievement) => !achievement.unlocked)

  return (
    <div className={styles.case}>
      <div className={styles.header}>
        <h2 className={styles.title}>Vitrina</h2>
        <span className={styles.count}>
          <strong>{unlocked.length}</strong> de {achievements.length}
        </span>
      </div>

      {unlocked.length > 0 ? (
        <ul className={styles.earned}>
          {unlocked.map((achievement) => (
            <li key={achievement.id} className={styles.trophy}>
              <span className={styles.medal} aria-hidden="true">
                <Icon name="trophy" size={20} />
              </span>
              <span className={styles.trophyText}>
                <span className={styles.trophyTitle}>{achievement.title}</span>
                <span className={styles.trophyDescription}>{achievement.description}</span>
              </span>
              {achievement.unlockedAt && (
                <span className={styles.trophyDate}>{formatUnlockedAt(achievement.unlockedAt)}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>Tu primer logro llega con tu primer pick.</p>
      )}

      {locked.length > 0 && (
        <>
          <span className={styles.lockedLabel}>Por desbloquear</span>
          <ul className={styles.locked}>
            {locked.map((achievement) => (
              <li key={achievement.id} className={styles.lockedItem}>
                <Icon name="lock" size={13} className={styles.lockedIcon} />
                <span className={styles.trophyText}>
                  <span className={styles.lockedTitle}>{achievement.title}</span>
                  <span className={styles.lockedDescription}>{achievement.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
