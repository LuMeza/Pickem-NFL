import { Link } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import type { Team } from '@/core/entities/catalog'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { DIVISION_ORDER, getTeamDivision } from '@/presentation/components/TeamBadge/teamDivisions'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import styles from './TeamsPage.module.css'

function groupByDivision(teams: Team[]) {
  return DIVISION_ORDER.map(({ conference, division }) => ({
    conference,
    division,
    teams: teams
      .filter((team) => {
        const teamDivision = getTeamDivision(team.id)
        return teamDivision?.conference === conference && teamDivision.division === division
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.teams.length > 0)
}

/** Tarea 6.1 (base-plataforma): listado de equipos NFL agrupados por division. */
export function TeamsPage() {
  const { status, data: teams, error } = useSession().teams
  const groups = groupByDivision(teams ?? [])

  return (
    <section>
      <span className="kicker">
        <Icon name="football" size={13} /> Catálogo NFL
      </span>
      <h1 className="text-display-lg">Equipos</h1>
      <p className="text-body-sm text-muted">Los 32 equipos de la NFL.</p>
      {status === 'pending' && <LoadingSpinner variant="inline" label="Cargando equipos" />}
      {error && <p role="alert">No se pudieron cargar los equipos.</p>}
      <div className={styles.divisionGrid}>
        {groups.map((group) => (
          <div key={`${group.conference}-${group.division}`} className={styles.divisionCard}>
            <h2 className={styles.divisionTitle}>
              {group.conference} {group.division}
            </h2>
            <ul className={styles.divisionList}>
              {group.teams.map((team) => (
                <li key={team.id}>
                  <Link to={`/teams/${team.id}`} className={styles.teamRow}>
                    <TeamBadge teamId={team.id} size="sm" />
                    <span className={styles.name}>{team.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
