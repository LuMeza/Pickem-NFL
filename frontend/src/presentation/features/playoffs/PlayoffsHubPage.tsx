import { ActionCard } from '@/presentation/components/ActionCard/ActionCard'

/** Landing del módulo Playoffs: picks por ronda y tabla de resultados. */
export function PlayoffsHubPage() {
  return (
    <section>
      <h1 className="text-display-lg">Playoffs</h1>
      <p className="text-body-sm text-muted">
        Predice por cada partido si gana el local por más de 6, si es cerrado o si gana la visita por más de 6.
      </p>
      <div className="card-grid">
        <ActionCard
          to="/playoffs/picks"
          icon="calendar"
          title="Mis picks de playoffs"
          description="Elige el rango de diferencia de cada partido antes del kickoff"
          featured
        />
        <ActionCard
          to="/playoffs/tabla"
          icon="trophy"
          title="Tabla de playoffs"
          description="Aciertos por ronda y podio final"
        />
      </div>
    </section>
  )
}
