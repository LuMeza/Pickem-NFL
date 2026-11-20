import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListGamesForWeek } from '@/presentation/hooks/useListGamesForWeek'
import { useCanViewPickemTables } from '@/presentation/hooks/useCanViewPickemTables'
import { useCheckPlatformAdmin } from '@/presentation/hooks/useCheckPlatformAdmin'
import { useListWeeklyStandings } from '@/presentation/hooks/useListWeeklyStandings'
import { useListSeasonStandings } from '@/presentation/hooks/useListSeasonStandings'
import { WeekSelector } from '@/presentation/components/WeekSelector/WeekSelector'
import { Icon } from '@/presentation/components/Icon/Icon'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { isPlayoffsStarted } from '@/core/rules/isPlayoffsStarted'
import { getInitials } from '@/core/rules/getInitials'
import { resolveTiedRanking } from '@/core/rules/resolveTiedRanking'
import type { StandingRow } from '@/core/entities/standings'
import type { WeekType } from '@/core/entities/catalog'
import { downloadWeeklyStandingsPdf, type StandingsExportRow } from './weeklyPicksMatrix/weeklyPicksMatrixExport'
import { weekLabel } from './weekLabel'
import styles from './PickemStandingsPage.module.css'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

/** Nadie hizo picks en HOF ni pretemporada — no aportan nada a la tabla de posiciones. */
const STANDINGS_SEGMENTS: WeekType[] = ['regular', 'playoffs']

/** A partir de esta racha de aciertos consecutivos se prende el fuego al lado del nombre. */
const FIRE_STREAK_THRESHOLD = 3
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

/** Aplana los niveles de empate en filas planas para el PDF, marcando ganador(es) al primer nivel. */
function buildStandingsExportRows(rows: StandingRow[]): StandingsExportRow[] {
  return groupIntoTiers(rows).flatMap((tier) =>
    tier.rows.map((row) => ({
      userId: row.userId,
      displayName: row.displayName,
      correctCount: row.correctCount,
      position: tier.position,
      isWinner: tier.position === 1,
    })),
  )
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

/** Posición (con empates) de un usuario en una tabla, o null si no aparece. */
function positionOf(rows: StandingRow[] | null, userId: string): number | null {
  if (!rows || rows.length === 0) return null
  const tier = groupIntoTiers(rows).find((candidate) => candidate.rows.some((row) => row.userId === userId))
  return tier ? tier.position : null
}

function splitPodium(rows: StandingRow[]) {
  const tiers = groupIntoTiers(rows)
  const podiumTiers = tiers.slice(0, 3)
  const podiumMemberCount = podiumTiers.reduce((sum, tier) => sum + tier.rows.length, 0)
  const showPodium = podiumMemberCount > 0 && podiumMemberCount <= MAX_PODIUM_MEMBERS
  return { tiers, podiumTiers, showPodium, listTiers: showPodium ? tiers.slice(3) : tiers }
}

const PODIUM_RANK_LABEL: Record<1 | 2 | 3, string> = { 1: '1er lugar', 2: '2do lugar', 3: '3er lugar' }

function PodiumSlot({ tier, rank }: { tier?: Tier; rank: 1 | 2 | 3 }) {
  if (!tier) return <div className={styles.podiumEmpty} aria-hidden="true" />

  const rankClass = rank === 1 ? styles.podiumFirst : rank === 2 ? styles.podiumSecond : styles.podiumThird

  return (
    <div className={`${styles.podiumSlot} ${rankClass}`}>
      <div className={styles.podiumBlock}>
        <span className={styles.podiumRankLabel}>
          {rank === 1 && <Icon name="trophy" size={12} />}
          {PODIUM_RANK_LABEL[rank]}
        </span>
        <span className={styles.podiumScore}>{tier.rows[0]!.correctCount}</span>
        <span className={styles.podiumScoreLabel}>
          {tier.rows[0]!.correctCount === 1 ? 'acierto' : 'aciertos'}
        </span>
        <ul className={styles.podiumMembers}>
          {tier.rows.map((row) => (
            <li key={row.userId} className={styles.podiumMember}>
              <span className={styles.podiumAvatar}>{getInitials(row.displayName)}</span>
              <span className={styles.podiumName}>{row.displayName}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Podio real (1° al centro y mas alto, 2°/3° a los lados) para el top 3 por nivel de puntaje — no por fila, asi que un empate no "corre" al resto de posiciones. */
function Podium({ tiers }: { tiers: Tier[] }) {
  if (tiers.length === 0) return null
  const [first, second, third] = tiers
  return (
    <div className={styles.podiumPanel}>
      <div className={styles.podium}>
        <PodiumSlot tier={second} rank={2} />
        <PodiumSlot tier={first} rank={1} />
        <PodiumSlot tier={third} rank={3} />
      </div>
    </div>
  )
}

interface MyResultProps {
  rows: StandingRow[]
  prevRows: StandingRow[] | null
  prevWeekNumber: number | null
  totalGames: number | null
  userId: string
}

/** Resumen personal arriba de la tabla semanal: lugar, aciertos, distancia al primero y cambio contra la semana anterior. Solo si el usuario aparece en la tabla (los admins no). */
function MyResult({ rows, prevRows, prevWeekNumber, totalGames, userId }: MyResultProps) {
  const tiers = groupIntoTiers(rows)
  const myTier = tiers.find((tier) => tier.rows.some((row) => row.userId === userId))
  if (!myTier) return null

  const myScore = myTier.rows[0]!.correctCount
  const gap = tiers[0]!.rows[0]!.correctCount - myScore
  const previousPosition = positionOf(prevRows, userId)
  const delta = previousPosition != null ? previousPosition - myTier.position : null

  return (
    <div className={`${styles.myResult} glass-surface`}>
      <div className={styles.myBlock}>
        <span className={styles.myLabel}>Tu lugar esta semana</span>
        <span className={styles.myPosition}>
          {myTier.position}°<span className={styles.mySoft}> de {rows.length}</span>
        </span>
      </div>
      <div className={styles.myBlock}>
        <span className={styles.myLabel}>Aciertos</span>
        <span className={styles.myValue}>
          {myScore}
          {totalGames ? ` de ${totalGames}` : ''}
        </span>
      </div>
      <div className={styles.myBlock}>
        <span className={styles.myLabel}>Distancia al 1°</span>
        <span className={gap === 0 ? styles.myValueLead : styles.myValueBehind}>{gap === 0 ? 'Vas arriba' : `-${gap}`}</span>
      </div>
      {delta != null && prevWeekNumber != null && (
        <div className={styles.myBlock}>
          <span className={styles.myLabel}>Vs semana {prevWeekNumber}</span>
          <span className={delta > 0 ? styles.myValueLead : delta < 0 ? styles.myValueBehind : styles.myValue}>
            {delta === 0 ? 'Igual' : `${delta > 0 ? '+' : ''}${delta} ${Math.abs(delta) === 1 ? 'lugar' : 'lugares'}`}
          </span>
        </div>
      )}
    </div>
  )
}

/** Tabla semanal: podio cuando cabe, y el resto por nivel de puntaje con los jugadores como chips y una barra relativa al primero. */
function WeeklyStandings({ rows, currentUserId }: { rows: StandingRow[]; currentUserId?: string | null }) {
  if (rows.length === 0) {
    return <p className="text-body-sm text-muted">Todavía no hay resultados para mostrar.</p>
  }

  const { tiers, podiumTiers, showPodium, listTiers } = splitPodium(rows)
  const leaderScore = tiers[0]!.rows[0]!.correctCount

  return (
    <>
      {showPodium && <Podium tiers={podiumTiers} />}
      {listTiers.length > 0 && (
        <ol className={`${styles.tiers} glass-surface`}>
          {listTiers.map((tier) => {
            const score = tier.rows[0]!.correctCount
            const isFirst = tier.position === 1
            return (
              <li key={tier.position} className={`${styles.tier} ${isFirst ? styles.tierFirst : ''}`}>
                <div className={styles.tierHead}>
                  <span className={styles.tierPosition}>{tier.position}°</span>
                  <span className={styles.tierScore}>
                    <strong>{score}</strong> {score === 1 ? 'acierto' : 'aciertos'}
                  </span>
                  {isFirst && tier.rows.length > 1 && (
                    <span className={styles.tierTie}>Empate entre {tier.rows.length} jugadores</span>
                  )}
                  {!isFirst && (
                    <span className={styles.tierBar} aria-hidden="true">
                      <span
                        className={styles.tierBarFill}
                        style={{ width: `${leaderScore > 0 ? (score / leaderScore) * 100 : 0}%` }}
                      />
                    </span>
                  )}
                </div>
                <ul className={styles.members}>
                  {tier.rows.map((row) => {
                    const onFire = row.currentStreak >= FIRE_STREAK_THRESHOLD
                    const isMe = row.userId === currentUserId
                    return (
                      <li key={row.userId} className={`${styles.member} ${isMe ? styles.memberMe : ''}`}>
                        <span className={styles.avatar}>{getInitials(row.displayName)}</span>
                        <span className={styles.nameText}>
                          {row.displayName}
                          {isMe ? ', tú' : ''}
                        </span>
                        {onFire && (
                          <span className={styles.fireBadge} title={`${row.currentStreak} aciertos seguidos`}>
                            <Icon name="flame" size={11} />
                            {row.currentStreak}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </li>
            )
          })}
        </ol>
      )}
    </>
  )
}

/** Panel de temporada: podio y, debajo, una fila por jugador (con la posición del empate). Tu fila queda fija abajo al hacer scroll. */
function SeasonStandings({ rows, currentUserId }: { rows: StandingRow[]; currentUserId?: string | null }) {
  if (rows.length === 0) {
    return <p className="text-body-sm text-muted">Todavía no hay resultados para mostrar.</p>
  }

  const { podiumTiers, showPodium, listTiers } = splitPodium(rows)
  const listRows = listTiers.flatMap((tier) => tier.rows.map((row) => ({ row, position: tier.position })))

  return (
    <>
      {showPodium && <Podium tiers={podiumTiers} />}
      {listRows.length > 0 && (
        <ol className={`${styles.compactList} glass-surface`}>
          {listRows.map(({ row, position }) => {
            const isMe = row.userId === currentUserId
            return (
              <li key={row.userId} className={`${styles.compactRow} ${isMe ? styles.compactMe : ''}`}>
                <span className={styles.compactPos}>{position}</span>
                <span className={styles.compactName}>{isMe ? `Tú, ${row.displayName}` : row.displayName}</span>
                <span className={styles.compactScore}>{row.correctCount}</span>
              </li>
            )
          })}
        </ol>
      )}
    </>
  )
}

/** Tareas 4.3/4.4/4.6/4.7 (modulo-pickem-semanal): tabla semanal, tabla acumulada de temporada, ganador(es) y resultado final al iniciar playoffs. */
export function PickemStandingsPage() {
  const { weekId } = useParams<{ weekId: string }>()
  const { data: group } = useSession().group
  const { data: profile } = useSession().profile
  const { data: weeks } = useSession().weeks
  const { data: canView, run: loadCanView } = useCanViewPickemTables()
  const { data: isAdmin, run: loadIsAdmin } = useCheckPlatformAdmin()
  const { status: weeklyStatus, data: weeklyStandings, run: loadWeeklyStandings } = useListWeeklyStandings()
  const { data: prevStandings, run: loadPrevStandings } = useListWeeklyStandings()
  const { data: seasonStandings, run: loadSeasonStandings } = useListSeasonStandings()
  const { data: wildCardGames, run: loadWildCardGames } = useListGamesForWeek()
  const { data: weekGames, run: loadWeekGames } = useListGamesForWeek()
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const activeWeek = weeks?.find((week) => week.id === weekId)
  const prevWeek = activeWeek
    ? weeks?.find((week) => week.type === activeWeek.type && week.number === activeWeek.number - 1)
    : undefined
  const activeWeekId = activeWeek?.id
  const prevWeekId = prevWeek?.id

  useEffect(() => {
    if (group && weekId) {
      loadCanView({ groupId: group.id })
      loadWeeklyStandings({ groupId: group.id, weekId })
      loadSeasonStandings({ groupId: group.id })
    }
  }, [group, weekId, loadCanView, loadWeeklyStandings, loadSeasonStandings])

  useEffect(() => {
    if (group && prevWeekId) loadPrevStandings({ groupId: group.id, weekId: prevWeekId })
  }, [group, prevWeekId, loadPrevStandings])

  useEffect(() => {
    if (activeWeekId) loadWeekGames({ weekId: activeWeekId })
  }, [activeWeekId, loadWeekGames])

  useEffect(() => {
    loadIsAdmin()
  }, [loadIsAdmin])

  const wildCardWeek = weeks?.find((week) => week.type === 'playoffs' && week.number === 1)
  useEffect(() => {
    if (wildCardWeek) loadWildCardGames({ weekId: wildCardWeek.id })
  }, [wildCardWeek, loadWildCardGames])

  if (!weekId) return null

  const playoffsStarted = wildCardWeek ? isPlayoffsStarted([wildCardWeek], wildCardGames ?? [], new Date()) : false
  const winners = playoffsStarted
    ? resolveTiedRanking((seasonStandings ?? []).map((row) => ({ userId: row.userId, total: row.correctCount })))[0]
    : undefined
  const winnerNames = winners
    ? winners.userIds
        .map((userId) => seasonStandings?.find((row) => row.userId === userId)?.displayName ?? userId)
        .join(', ')
    : ''

  async function handleDownloadWeeklyStandingsPdf() {
    const rows = weeklyStandings ?? []
    if (downloadingPdf || !activeWeek || rows.length === 0) return
    setDownloadingPdf(true)
    try {
      await downloadWeeklyStandingsPdf({
        rows: buildStandingsExportRows(rows),
        title: weekLabel(activeWeek),
        subtitle: 'Pickem semanal — tabla de posiciones',
        fileName: `tabla-posiciones-${slugify(weekLabel(activeWeek))}.pdf`,
      })
    } catch (err) {
      console.error('No se pudo generar el PDF de la tabla de posiciones', err)
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <section>
      <h1 className="text-display-lg">Tabla de posiciones</h1>
      <WeekSelector activeWeekId={weekId} linkTo={(id) => `/pickem/tabla/${id}`} allowedSegments={STANDINGS_SEGMENTS} />

      {canView === false && <EmptyState message={EMPTY_STATE_COPY.noModuleAccess} />}

      {canView && (
        <>
          {playoffsStarted && winners && (
            <div className={`${styles.winnerBanner} glass-surface`}>
              <span className="text-body-sm text-muted">Resultado final de temporada</span>
              <p className="text-display-sm">
                {winners.userIds.length > 1 ? 'Empate en el primer lugar: ' : 'Ganador: '}
                {winnerNames} ({winners.total} {winners.total === 1 ? 'acierto' : 'aciertos'})
              </p>
            </div>
          )}

          {profile && (weeklyStandings ?? []).length > 0 && (
            <div className={styles.myResultWrap}>
              <MyResult
                rows={weeklyStandings ?? []}
                prevRows={prevStandings}
                prevWeekNumber={prevWeek?.number ?? null}
                totalGames={weekGames ? weekGames.length : null}
                userId={profile.userId}
              />
            </div>
          )}

          <div className={styles.columns}>
            <div className={styles.mainCol}>
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={`text-display-sm ${styles.sectionTitle}`}>
                    {activeWeek ? weekLabel(activeWeek) : 'Esta semana'}
                  </h2>
                  {isAdmin && (weeklyStandings ?? []).length > 0 && (
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={handleDownloadWeeklyStandingsPdf}
                      disabled={downloadingPdf}
                    >
                      <Icon name="download" size={14} />
                      {downloadingPdf ? 'Generando PDF...' : 'Descargar PDF'}
                    </button>
                  )}
                </div>
                {weeklyStatus === 'pending' && <LoadingSpinner variant="inline" />}
                <WeeklyStandings rows={weeklyStandings ?? []} currentUserId={profile?.userId} />
              </div>

              <a href="#temporada" className={styles.jumpLink}>
                Ver acumulada de temporada
              </a>
            </div>

            <aside id="temporada" className={`${styles.section} ${styles.side}`}>
              <h2 className={`text-display-sm ${styles.sectionTitle}`}>
                {playoffsStarted ? 'Tabla final de temporada' : 'Acumulada de temporada'}
              </h2>
              <SeasonStandings rows={seasonStandings ?? []} currentUserId={profile?.userId} />
            </aside>
          </div>
        </>
      )}
    </section>
  )
}
