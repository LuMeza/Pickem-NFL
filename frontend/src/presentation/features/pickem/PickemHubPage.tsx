import { ActionCard } from '@/presentation/components/ActionCard/ActionCard'

/**
 * Landing del tab "Pickem" del nav: solo lo de Pickem (picks, tabla, picks del
 * grupo). Survivor no se repite aquí — tiene su propio tab en el nav.
 */
export function PickemHubPage() {
  return (
    <section>
      <h1 className="text-display-lg">Pickem</h1>
      <p className="text-body-sm text-muted">Tus picks de la semana, la tabla y los picks del grupo.</p>
      <div className="card-grid">
        <ActionCard
          to="/weeks"
          icon="calendar"
          title="Pickem Semanal"
          description="Predice el resultado de cada partido de la semana"
          featured
        />
        <ActionCard
          to="/pickem/tabla"
          icon="trophy"
          title="Tabla de posiciones"
          description="Quién va arriba esta semana y en la temporada"
        />
        <ActionCard
          to="/pickem/picks"
          icon="users"
          title="Picks de todos"
          description="Compara tus picks con los de los demás, una vez que se bloquea la semana"
        />
        <ActionCard
          to="/playoffs"
          icon="trophy"
          title="Playoffs"
          description="Próximamente"
          disabled
        />
      </div>
    </section>
  )
}
