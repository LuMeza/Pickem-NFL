import { useEffect } from 'react'
import { useDefaultGroup } from '@/presentation/hooks/useDefaultGroup'
import { useRecalculateSurvivorState } from '@/presentation/hooks/useRecalculateSurvivorState'
import { Icon } from '@/presentation/components/Icon/Icon'

/** Panel admin, plan B (modulo-survivor design.md decision 4): el recalculo corre solo al cargarse un resultado; este boton lo dispara a mano por si eso no paso. */
export function AdminSurvivorPage() {
  const { data: group, run: loadGroup } = useDefaultGroup()
  const { status, error, run: recalculate } = useRecalculateSurvivorState()

  useEffect(() => {
    loadGroup()
  }, [loadGroup])

  return (
    <section>
      <span className="kicker">
        <Icon name="refresh" size={13} /> Survivor
      </span>
      <h1 className="text-display-lg">Recalcular Survivor</h1>
      <p className="text-body-sm text-muted">
        El estado de Survivor (vidas, eliminaciones, podio) se recalcula solo cada vez que se carga un resultado —
        a mano o vía la sincronización con ESPN. Usá este botón como plan B si el recálculo automático no corrió.
      </p>

      {group && (
        <button type="button" onClick={() => recalculate({ groupId: group.id })} disabled={status === 'pending'}>
          {status === 'pending' ? 'Recalculando...' : 'Recalcular ahora'}
        </button>
      )}

      {status === 'success' && <p className="text-body-sm text-muted">Listo, estado actualizado.</p>}
      {error && <p role="alert">No se pudo recalcular: {error.message}</p>}
    </section>
  )
}
