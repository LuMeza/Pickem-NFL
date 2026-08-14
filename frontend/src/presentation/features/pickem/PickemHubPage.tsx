import { ActionCard } from '@/presentation/components/ActionCard/ActionCard'
import { Icon } from '@/presentation/components/Icon/Icon'

/** Landing del tab "Pickem" del nav — agrupa los modos de juego (reemplaza al acceso directo a /weeks). */
export function PickemHubPage() {
  return (
    <section>
      <span className="kicker">
        <Icon name="trophy" size={13} /> Modos de juego
      </span>
      <h1 className="text-display-lg">Pickem</h1>
      <p className="text-body-sm text-muted">Elige con qué modo quieres jugar esta semana.</p>
      <div className="card-grid">
        <ActionCard
          to="/weeks"
          icon="calendar"
          title="Pickem Semanal"
          description="Predice el resultado de cada partido de la semana"
          featured
        />
        <ActionCard
          to="/survivor"
          icon="football"
          title="Survivor"
          description="Elige tu equipo de la semana, sin repetir en toda la temporada"
        />
        <ActionCard
          to="/pickem/picks"
          icon="users"
          title="Picks de todos"
          description="Compará tus picks con los de los demás, una vez que se bloquea la semana"
        />
        <ActionCard
          to="/playoffs"
          icon="trophy"
          title="Playoffs"
          description="Proximamente"
          disabled
        />
      </div>
    </section>
  )
}
