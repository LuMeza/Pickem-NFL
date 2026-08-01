import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useListTeams } from '@/presentation/hooks/useListTeams'
import { TeamBadge } from '@/presentation/components/TeamBadge/TeamBadge'
import { getTeamColors } from '@/presentation/components/TeamBadge/teamColors'
import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './TeamsPage.module.css'

/** Tarea 6.1 (base-plataforma): listado de equipos NFL. */
export function TeamsPage() {
  const { status, data: teams, error, run } = useListTeams()

  useEffect(() => {
    run()
  }, [run])

  return (
    <section>
      <span className="kicker">
        <Icon name="football" size={13} /> Catalogo NFL
      </span>
      <h1 className="text-display-lg">Equipos</h1>
      <p className="text-body-sm text-muted">Los 32 equipos de la NFL.</p>
      {status === 'pending' && <p>Cargando equipos...</p>}
      {error && <p role="alert">No se pudieron cargar los equipos.</p>}
      <div className={styles.grid}>
        {teams?.map((team) => (
          <Link key={team.id} to={`/teams/${team.id}`} className={`${styles.card} glass-surface glass-interactive`}>
            <span className={styles.accent} style={{ background: getTeamColors(team.id).primary }} />
            <TeamBadge teamId={team.id} size="lg" />
            <span className={styles.name}>{team.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
