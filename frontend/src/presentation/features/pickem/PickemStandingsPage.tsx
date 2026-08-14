import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useCanViewPickemTables } from '@/presentation/hooks/useCanViewPickemTables'
import { useListWeeklyStandings } from '@/presentation/hooks/useListWeeklyStandings'
import { useListSeasonStandings } from '@/presentation/hooks/useListSeasonStandings'
import { WeekSelector } from '@/presentation/components/WeekSelector/WeekSelector'
import { Icon } from '@/presentation/components/Icon/Icon'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { isPlayoffsStarted } from '@/core/rules/isPlayoffsStarted'
import { resolveTiedRanking } from '@/core/rules/resolveTiedRanking'
import type { StandingRow } from '@/core/entities/standings'
import { weekLabel } from './weekLabel'
import styles from './PickemStandingsPage.module.css'

/** A partir de esta racha de aciertos consecutivos se prende el fuego al lado del nombre. */
const FIRE_STREAK_THRESHOLD = 3
/** En el pedestal, mostrar como mucho estos avatares superpuestos antes de resumir en "+N". */
const MAX_PODIUM_AVATARS = 3
/**
 * Si el top 3 por nivel de puntaje junta mas gente que esto (comun en
 * semanas con pocos partidos, donde empatan muchos), el podio deja de tener
 * sentido — nadie destaca. Se salta el podio y se muestra la lista simple
 * para todos; en cuanto los puntajes se separen mas adelante en la
 * temporada, el podio "aparece" solo.
 */
const MAX_PODIUM_MEMBERS = 6

interface Tier {
  position: number
  rows: StandingRow[]
}

/** Iniciales para el avatar — primera letra del nombre y del apellido (o las dos primeras si no hay apellido). */
function initials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? displayName
}

/** Agrupa filas ya ordenadas por correctCount en "niveles": empatados en el mismo puntaje comparten posición (ranking de competencia — 1,1,1,4,5, no 1,1,1,2,3). */
function groupIntoTiers(rows: StandingRow[]): Tier[] {
  const tiers: Tier[] = []
  rows.forEach((row, index) => {
    const lastTier = tiers[tiers.length - 1]
    if (lastTier && lastTier.rows[0]!.correctCount === row.correctCount) {
      lastTier.rows.push(row)
    } else {
      tiers.push({ position: index + 1, rows: [row] })
    }
  })
  return tiers
}

function PodiumSlot({ tier, rank }: { tier?: Tier; rank: 1 | 2 | 3 }) {
  if (!tier) return <div className={styles.podiumEmpty} aria-hidden="true" />

  const rankClass = rank === 1 ? styles.podiumFirst : rank === 2 ? styles.podiumSecond : styles.podiumThird
  const shown = tier.rows.slice(0, MAX_PODIUM_AVATARS)
  const extra = tier.rows.length - shown.length
  const label =
    tier.rows.length === 1
      ? tier.rows[0]!.displayName
      : tier.rows.length === 2
        ? tier.rows.map((row) => firstName(row.displayName)).join(' y ')
        : `${tier.rows.length} empatados`

  return (
    <div className={`${styles.podiumSlot} ${rankClass}`}>
      <div className={styles.podiumAvatars}>
        {shown.map((row) => (
          <span key={row.userId} className={styles.podiumAvatar} title={row.displayName}>
            {initials(row.displayName)}
          </span>
        ))}
        {extra > 0 && <span className={styles.podiumAvatarExtra}>+{extra}</span>}
      </div>
      <span className={styles.podiumNames} title={tier.rows.map((row) => row.displayName).join(', ')}>
        {label}
      </span>
      <div className={styles.podiumBlock}>
        {rank === 1 && <Icon name="trophy" size={16} />}
        <span className={styles.podiumScore}>{tier.rows[0]!.correctCount}</span>
      </div>
    </div>
  )
}

/** Podio real (1° al centro y mas alto, 2°/3° a los lados) para el top 3 por nivel de puntaje — no por fila, asi que un empate no "corre" al resto de posiciones. */
function Podium({ tiers }: { tiers: Tier[] }) {
  if (tiers.length === 0) return null
  const [first, second, third] = tiers
  return (
    <div className={`${styles.podiumPanel} glass-surface`}>
      <div className={styles.podium}>
        <PodiumSlot tier={second} rank={2} />
        <PodiumSlot tier={first} rank={1} />
        <PodiumSlot tier={third} rank={3} />
      </div>
    </div>
  )
}

function StandingsList({ rows }: { rows: StandingRow[] }) {
  if (rows.length === 0) {
    return <p className="text-body-sm text-muted">Todavía no hay resultados para mostrar.</p>
  }

  const tiers = groupIntoTiers(rows)
  const podiumTiers = tiers.slice(0, 3)
  const podiumMemberCount = podiumTiers.reduce((sum, tier) => sum + tier.rows.length, 0)
  const showPodium = podiumMemberCount > 0 && podiumMemberCount <= MAX_PODIUM_MEMBERS
  const listTiers = showPodium ? tiers.slice(3) : tiers

  return (
    <>
      {showPodium && <Podium tiers={podiumTiers} />}
      {listTiers.length > 0 && (
        <ul className={`${styles.list} glass-surface`}>
          {listTiers.flatMap((tier) =>
            tier.rows.map((row) => {
              const onFire = row.currentStreak >= FIRE_STREAK_THRESHOLD
              return (
                <li key={row.userId} className={styles.row}>
                  <span className={styles.position}>{tier.position}°</span>
                  <span className={styles.avatarWrap}>
                    <span className={styles.avatar}>{initials(row.displayName)}</span>
                    {onFire && (
                      <span className={styles.fireBadge} title={`${row.currentStreak} aciertos seguidos`}>
                        🔥{row.currentStreak}
                      </span>
                    )}
                  </span>
                  <span className={styles.nameText}>{row.displayName}</span>
                  <span className={styles.count}>{row.correctCount}</span>
                </li>
              )
            }),
          )}
        </ul>
      )}
    </>
  )
}

/** Tareas 4.3/4.4/4.6/4.7 (modulo-pickem-semanal): tabla semanal, tabla acumulada de temporada, ganador(es) y resultado final al iniciar playoffs. */
export function PickemStandingsPage() {
  const { weekId } = useParams<{ weekId: string }>()
  const { data: group } = useSession().group
  const { data: weeks } = useSession().weeks
  const { data: canView, run: loadCanView } = useCanViewPickemTables()
  const { status: weeklyStatus, data: weeklyStandings, run: loadWeeklyStandings } = useListWeeklyStandings()
  const { data: seasonStandings, run: loadSeasonStandings } = useListSeasonStandings()
  const { data: wildCardGames, run: loadWildCardGames } = useListGamesForWeek()

  useEffect(() => {
    if (group && weekId) {
      loadCanView({ groupId: group.id })
      loadWeeklyStandings({ groupId: group.id, weekId })
      loadSeasonStandings({ groupId: group.id })
    }
  }, [group, weekId, loadCanView, loadWeeklyStandings, loadSeasonStandings])

  const wildCardWeek = weeks?.find((week) => week.type === 'playoffs' && week.number === 1)
  useEffect(() => {
    if (wildCardWeek) loadWildCardGames({ weekId: wildCardWeek.id })
  }, [wildCardWeek, loadWildCardGames])

  if (!weekId) return null

  const activeWeek = weeks?.find((week) => week.id === weekId)
  const playoffsStarted = wildCardWeek ? isPlayoffsStarted([wildCardWeek], wildCardGames ?? [], new Date()) : false
  const winners = playoffsStarted
    ? resolveTiedRanking((seasonStandings ?? []).map((row) => ({ userId: row.userId, total: row.correctCount })))[0]
    : undefined
  const winnerNames = winners
    ? winners.userIds
        .map((userId) => seasonStandings?.find((row) => row.userId === userId)?.displayName ?? userId)
        .join(', ')
    : ''

  return (
    <section>
      <span className="kicker">
        <Icon name="trophy" size={13} /> Pickem semanal
      </span>
      <h1 className="text-display-lg">Tabla de posiciones</h1>
      <WeekSelector activeWeekId={weekId} linkTo={(id) => `/pickem/tabla/${id}`} />

      {canView === false && <EmptyState message={EMPTY_STATE_COPY.noModuleAccess} />}

      {canView && (
        <>
          {playoffsStarted && winners && (
            <div className={`${styles.winnerBanner} glass-surface`}>
              <span className="text-body-sm text-muted">Resultado final de temporada</span>
              <p className="text-display-sm">
                {winners.userIds.length > 1 ? 'Empate en el primer lugar: ' : 'Ganador: '}
                {winnerNames} ({winners.total} aciertos)
              </p>
            </div>
          )}

          <div className={styles.section}>
            <h2 className={`text-display-sm ${styles.sectionTitle}`}>
              {activeWeek ? weekLabel(activeWeek) : 'Esta semana'}
            </h2>
            {weeklyStatus === 'pending' && <LoadingSpinner variant="inline" />}
            <StandingsList rows={weeklyStandings ?? []} />
          </div>

          <div className={styles.section}>
            <h2 className={`text-display-sm ${styles.sectionTitle}`}>
              {playoffsStarted ? 'Tabla final de temporada' : 'Tabla acumulada de temporada'}
            </h2>
            <StandingsList rows={seasonStandings ?? []} />
          </div>
        </>
      )}
    </section>
  )
}
