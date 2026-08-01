import { ActionCard } from '@/presentation/components/ActionCard/ActionCard'
import { Icon } from '@/presentation/components/Icon/Icon'

/** Landing post-login. */
export function HomePage() {
  return (
    <section>
      <span className="kicker">
        <Icon name="football" size={13} /> Temporada regular
      </span>
      <h1 className="text-display-lg">Pickem NFL</h1>
      <p className="text-body-sm text-muted">Tu semana arranca aqui.</p>
      <div className="card-grid">
        <ActionCard
          to="/weeks"
          icon="calendar"
          title="Ver semanas y partidos"
          description="Entra a la semana activa y revisa las propuestas de cada partido"
          featured
        />
        <ActionCard
          to="/calendario"
          icon="calendar"
          title="Calendario completo"
          description="Todos los partidos de la temporada, de Hall of Fame a playoffs"
        />
        <ActionCard
          to="/pickem/acceso"
          icon="ticket"
          title="Acceso al pickem semanal"
          description="Solicita entrar al pickem de cada semana antes de que arranque"
        />
        <ActionCard
          to="/pickem/tabla"
          icon="trophy"
          title="Tabla de posiciones"
          description="Aciertos de la semana y acumulado de temporada"
        />
        <ActionCard
          to="/survivor"
          icon="football"
          title="Survivor"
          description="Elegi tu equipo de la semana, sin repetir en toda la temporada"
        />
        <ActionCard
          to="/survivor/tabla"
          icon="trophy"
          title="Estado de Survivor"
          description="Quien sigue vivo, quien uso vidas extra y el podio"
        />
        <ActionCard
          to="/request-access"
          icon="ticket"
          title="Acceso a otros modulos"
          description="Playoffs, cuando este disponible"
        />
        <ActionCard to="/teams" icon="football" title="Equipos" description="Catalogo completo de la NFL" />
        <ActionCard to="/profile" icon="user" title="Mi perfil" description="Edita tu nombre visible" />
      </div>
    </section>
  )
}
