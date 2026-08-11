import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import type { Team } from '@/core/entities/catalog'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { getReadableAccent } from '@/presentation/components/TeamBadge/teamColors'
import { DIVISION_ORDER, getTeamDivision } from '@/presentation/components/TeamBadge/teamDivisions'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import styles from './TeamsPage.module.css'

function teamMascot(name: string): string {
  return name.split(' ').pop() ?? name
}

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

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function TeamTile({ team }: { team: Team }) {
  const accent = getReadableAccent(team.id)
  return (
    <Link to={`/teams/${team.id}`} className={styles.teamTile} style={{ '--team-accent': accent } as CSSProperties} title={team.name}>
      <TeamBadge teamId={team.id} size="lg" />
      <span className={styles.name}>{teamMascot(team.name)}</span>
    </Link>
  )
}

/** Tarea 6.1 (base-plataforma): listado de equipos NFL agrupados por division. */
export function TeamsPage() {
  const { status, data: teams, error } = useSession().teams
  const [query, setQuery] = useState('')

  const normalizedQuery = normalize(query.trim())
  const filteredTeams = useMemo(
    () => (teams ?? []).filter((team) => normalize(team.name).includes(normalizedQuery)),
    [teams, normalizedQuery],
  )
  const groups = useMemo(() => groupByDivision(filteredTeams), [filteredTeams])

  return (
    <section>
      <span className="kicker">
        <Icon name="football" size={13} /> Catálogo NFL
      </span>
      <h1 className="text-display-lg">Equipos</h1>
      <p className="text-body-sm text-muted">Los 32 equipos de la NFL.</p>

      <div className={styles.searchField}>
        <Icon name="search" size={14} className={styles.searchIcon} />
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Buscar equipo..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar equipo por nombre"
        />
      </div>

      {status === 'pending' && <LoadingSpinner variant="inline" label="Cargando equipos" />}
      {error && <p role="alert">No se pudieron cargar los equipos.</p>}
      {teams && normalizedQuery && filteredTeams.length === 0 && <EmptyState message="No se encontraron equipos." />}

      <div className={styles.divisionGrid}>
        {groups.map((group) => (
          <div key={`${group.conference}-${group.division}`} className={styles.divisionSection}>
            <h2 className={styles.divisionTitle}>
              {group.conference} {group.division}
            </h2>
            <div className={styles.teamGrid}>
              {group.teams.map((team) => (
                <TeamTile key={team.id} team={team} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
