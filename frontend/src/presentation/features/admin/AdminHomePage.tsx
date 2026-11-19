import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/presentation/components/Icon/Icon'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListGroupMembers } from '@/presentation/hooks/useListGroupMembers'
import { useListModuleAccessRequests } from '@/presentation/hooks/useListModuleAccessRequests'
import { useListResultsForGames } from '@/presentation/hooks/useListResultsForGames'
import { useListAdminWeeklyPayments } from '@/presentation/hooks/useListAdminWeeklyPayments'
import { pickDefaultWeek } from '@/core/rules/pickDefaultWeek'
import { weekLabel } from '@/presentation/features/pickem/weekLabel'
import styles from './AdminHomePage.module.css'

/** Un partido dura ~4h en cancha: pasado ese margen ya debería tener marcador. */
const GAME_DURATION_MS = 4 * 60 * 60 * 1000

interface AdminLink {
  to: string
  label: string
  hint: string
}

interface AdminArea {
  icon: IconName
  title: string
  description: string
  links: AdminLink[]
}

/** Agrupado por lo que el admin quiere lograr, con nombres en lenguaje normal — así sabe donde buscar cada cosa. */
const AREAS: AdminArea[] = [
  {
    icon: 'users',
    title: 'Jugadores',
    description: 'Quién está en el grupo y a qué puede entrar.',
    links: [
      { to: '/admin/users', label: 'Invitar o editar jugadores', hint: 'Crear cuenta, cambiar datos o dar de baja' },
      { to: '/admin/members', label: 'Sacar a alguien del grupo', hint: 'Deja de aparecer en las tablas' },
      { to: '/admin/access-requests', label: 'Solicitudes de acceso', hint: 'Para entrar a otros módulos, como Playoffs' },
    ],
  },
  {
    icon: 'calendar',
    title: 'Partidos',
    description: 'El calendario y los marcadores.',
    links: [
      { to: '/admin/sync', label: 'Traer partidos y resultados de ESPN', hint: 'Lo normal cada semana' },
      { to: '/admin/results', label: 'Cargar o corregir un marcador', hint: 'Cuando ESPN no lo trae o viene mal' },
      { to: '/admin/games/new', label: 'Agregar un partido a mano', hint: 'Solo si ESPN no lo tiene' },
    ],
  },
  {
    icon: 'trophy',
    title: 'Quinielas',
    description: 'Las reglas del Pickem y del Survivor.',
    links: [
      { to: '/admin/pickem/settings', label: 'Qué ven los jugadores', hint: 'Mostrar u ocultar tablas y pronósticos' },
      { to: '/admin/survivor', label: 'Recalcular Survivor', hint: 'Solo si no se actualizó solo' },
    ],
  },
  {
    icon: 'search',
    title: 'Picks y pagos',
    description: 'Quién ya eligió y quién ya pagó.',
    links: [
      { to: '/admin/picks', label: 'Ver picks y pagos', hint: 'Pickem semanal y Survivor, por semana o por jugador' },
    ],
  },
]

/** Panel de administrador (tarea 7.3: solo accesible para platform_admins via RequireAdmin). */
export function AdminHomePage() {
  const { group: groupResource, weeks: weeksResource, games: gamesResource } = useSession()
  const group = groupResource.data
  const weeks = weeksResource.data
  const games = gamesResource.data

  const { data: requests, run: loadRequests } = useListModuleAccessRequests()
  const { data: members, run: loadMembers } = useListGroupMembers()
  const { data: results, run: loadResults } = useListResultsForGames()
  const { data: payments, run: loadPayments } = useListAdminWeeklyPayments()

  const currentWeek = useMemo(() => {
    if (!weeks || !games || weeks.length === 0) return null
    return pickDefaultWeek(weeks, games, new Date())
  }, [weeks, games])

  const weekGames = useMemo(
    () => (currentWeek && games ? games.filter((game) => game.weekId === currentWeek.id) : []),
    [currentWeek, games],
  )

  useEffect(() => {
    if (!group) return
    loadRequests({ groupId: group.id }).catch(() => {})
    loadMembers({ groupId: group.id }).catch(() => {})
  }, [group, loadRequests, loadMembers])

  useEffect(() => {
    if (weekGames.length > 0) loadResults({ gameIds: weekGames.map((game) => game.id) }).catch(() => {})
  }, [weekGames, loadResults])

  useEffect(() => {
    if (group && currentWeek) loadPayments({ groupId: group.id, weekId: currentWeek.id }).catch(() => {})
  }, [group, currentWeek, loadPayments])

  const pendingRequests = requests?.filter((request) => request.status === 'solicitado').length ?? null

  const pendingResults = useMemo(() => {
    if (!results || weekGames.length === 0) return currentWeek && games && weekGames.length === 0 ? 0 : null
    const withResult = new Set(results.map((result) => result.gameId))
    const now = Date.now()
    return weekGames.filter(
      (game) => game.kickoffAt.getTime() + GAME_DURATION_MS < now && !withResult.has(game.id),
    ).length
  }, [results, weekGames, currentWeek, games])

  const paidCount = payments?.filter((row) => row.paid).length ?? null
  const memberCount = members?.length ?? null

  const attention = [
    pendingResults
      ? {
          to: '/admin/results',
          count: pendingResults,
          title: pendingResults === 1 ? 'Partido sin marcador' : 'Partidos sin marcador',
          hint: 'Cárgalos para que se sumen los puntos',
        }
      : null,
    pendingRequests
      ? {
          to: '/admin/access-requests',
          count: pendingRequests,
          title: pendingRequests === 1 ? 'Solicitud de acceso' : 'Solicitudes de acceso',
          hint: 'Jugadores esperando tu respuesta',
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  const loaded = pendingResults !== null && pendingRequests !== null
  const allPaid = paidCount !== null && memberCount !== null && memberCount > 0 && paidCount >= memberCount

  return (
    <section>
      <h1 className="text-display-lg">Panel de administrador</h1>
      <p className="text-body-sm text-muted">
        {currentWeek ? `${weekLabel(currentWeek)}. ` : ''}Esto es lo que está pasando ahora mismo en tu grupo.
      </p>

      <div className={styles.block}>
        {loaded && attention.length > 0 && (
          <>
            <h2 className={`${styles.blockTitle} ${styles.blockTitleWarn}`}>
              Necesita tu atención · {attention.length}
            </h2>
            <ul className={styles.list}>
              {attention.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={styles.alertRow}>
                    <span className={styles.alertCount}>{item.count}</span>
                    <span className={styles.body}>
                      <span className={styles.title}>{item.title}</span>
                      <span className={styles.description}>{item.hint}</span>
                    </span>
                    <span className={styles.chevron} aria-hidden="true">
                      ›
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {loaded && attention.length === 0 && (
          <p className={styles.allGood}>
            <span className={`${styles.dot} ${styles.dotOk}`} aria-hidden="true" />
            Nada pendiente por ahora.
          </p>
        )}

        {!loaded && <p className="text-body-sm text-muted">Revisando qué hay pendiente…</p>}
      </div>

      {(paidCount !== null || memberCount !== null) && (
        <div className={styles.block}>
          <h2 className={styles.blockTitle}>Resumen de la semana</h2>
          <div className={styles.chips}>
            {paidCount !== null && memberCount !== null && (
              <Link to="/admin/picks" className={styles.chip}>
                <span className={styles.chipLabel}>
                  <span className={`${styles.dot} ${allPaid ? styles.dotOk : styles.dotWarn}`} aria-hidden="true" />
                  Pagos del Pickem
                </span>
                <span className={styles.chipValue}>
                  <span className={styles.mono}>
                    {paidCount}/{memberCount}
                  </span>{' '}
                  pagaron
                </span>
              </Link>
            )}
            {memberCount !== null && (
              <Link to="/admin/members" className={styles.chip}>
                <span className={styles.chipLabel}>
                  <span className={`${styles.dot} ${styles.dotOk}`} aria-hidden="true" />
                  Jugadores
                </span>
                <span className={styles.chipValue}>
                  <span className={styles.mono}>{memberCount}</span> en el grupo
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className={styles.block}>
        <h2 className={styles.blockTitle}>Todas las áreas</h2>
        <div className={styles.areas}>
          {AREAS.map((area) => (
            <div key={area.title} className={`${styles.area} glass-surface`}>
              <div className={styles.areaHeader}>
                <span className={styles.iconWrap}>
                  <Icon name={area.icon} size={20} />
                </span>
                <div className={styles.body}>
                  <h3 className={styles.areaTitle}>{area.title}</h3>
                  <p className={styles.description}>{area.description}</p>
                </div>
              </div>
              <ul className={styles.areaLinks}>
                {area.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className={styles.linkRow}>
                      <span className={styles.body}>
                        <span className={styles.linkLabel}>{link.label}</span>
                        <span className={styles.description}>{link.hint}</span>
                      </span>
                      <span className={styles.chevron} aria-hidden="true">
                        ›
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
