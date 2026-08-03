import { ActionCard } from '@/presentation/components/ActionCard/ActionCard'
import { Icon } from '@/presentation/components/Icon/Icon'
import { UpcomingGamesStrip } from './UpcomingGamesStrip'
import styles from './HomePage.module.css'

/** Landing post-login — agrupada por que necesita hacer el usuario, no por orden de creación (ver design-system.md). */
export function HomePage() {
  return (
    <section>
      <span className="kicker">
        <Icon name="football" size={13} /> Temporada regular
      </span>
      <h1 className="text-display-lg">Pickem NFL</h1>
      <p className="text-body-sm text-muted">Tu semana arranca aquí.</p>

      <UpcomingGamesStrip />

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Tu semana</h2>
        <div className="card-grid">
          <ActionCard
            to="/weeks"
            icon="calendar"
            title="Ver semanas y partidos"
            description="Entra a la semana activa y revisa las propuestas de cada partido"
            featured
          />
          <ActionCard
            to="/pickem/acceso"
            icon="ticket"
            title="Acceso al pickem semanal"
            description="Solicita entrar al pickem de cada semana antes de que arranque"
          />
          <ActionCard
            to="/survivor"
            icon="football"
            title="Survivor"
            description="Elige tu equipo de la semana, sin repetir en toda la temporada"
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Tablas y resultados</h2>
        <div className="card-grid">
          <ActionCard
            to="/pickem/tabla"
            icon="trophy"
            title="Tabla de posiciones"
            description="Aciertos de la semana y acumulado de temporada"
          />
          <ActionCard
            to="/survivor/tabla"
            icon="trophy"
            title="Estado de Survivor"
            description="Quien sigue vivo, quien uso vidas extra y el podio"
          />
          <ActionCard
            to="/calendario"
            icon="calendar"
            title="Calendario completo"
            description="Todos los partidos de la temporada, de Hall of Fame a playoffs"
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Más</h2>
        <div className="card-grid">
          <ActionCard
            to="/request-access"
            icon="ticket"
            title="Acceso a otros módulos"
            description="Playoffs, cuando este disponible"
          />
          <ActionCard to="/teams" icon="football" title="Equipos" description="Catálogo completo de la NFL" />
          <ActionCard to="/profile" icon="user" title="Mi perfil" description="Edita tu nombre visible" />
        </div>
      </div>
    </section>
  )
}
