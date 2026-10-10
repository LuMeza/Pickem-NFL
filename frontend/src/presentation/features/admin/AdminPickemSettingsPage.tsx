import { useEffect } from 'react'
import type { PredictionsMode } from '@/core/entities/gamePrediction'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useGetPickemTablesVisibility } from '@/presentation/hooks/useGetPickemTablesVisibility'
import { useSetPickemTablesVisibility } from '@/presentation/hooks/useSetPickemTablesVisibility'
import { useGetPickemPredictionsMode } from '@/presentation/hooks/useGetPickemPredictionsMode'
import { useSetPickemPredictionsMode } from '@/presentation/hooks/useSetPickemPredictionsMode'

const PREDICTIONS_MODE_OPTIONS: { value: PredictionsMode; label: string }[] = [
  { value: 'off', label: 'Ocultos' },
  { value: 'after_lock', label: 'Después del cierre del pick' },
  { value: 'always', label: 'Siempre' },
]

/**
 * Tarea 4.5 (modulo-pickem-semanal): habilitar/deshabilitar que usuarios sin acceso semanal aprobado vean las tablas de posiciones.
 * Tarea 5.3 (espn-game-predictions): modo de visibilidad de pronósticos en la hoja de picks.
 */
export function AdminPickemSettingsPage() {
  const { data: group } = useSession().group
  const { data: visible, run: loadVisibility } = useGetPickemTablesVisibility()
  const { status: saveStatus, run: saveVisibility } = useSetPickemTablesVisibility()
  const { data: predictionsMode, run: loadPredictionsMode } = useGetPickemPredictionsMode()
  const { status: saveModeStatus, error: saveModeError, run: savePredictionsMode } = useSetPickemPredictionsMode()

  useEffect(() => {
    if (group) {
      loadVisibility({ groupId: group.id })
      loadPredictionsMode({ groupId: group.id })
    }
  }, [group, loadVisibility, loadPredictionsMode])

  async function handleToggle(event: React.ChangeEvent<HTMLInputElement>) {
    if (!group) return
    await saveVisibility({ groupId: group.id, visible: event.target.checked })
    loadVisibility({ groupId: group.id })
  }

  async function handlePredictionsModeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    if (!group) return
    try {
      await savePredictionsMode({ groupId: group.id, mode: event.target.value as PredictionsMode })
    } catch {
      // el error queda reflejado via el estado del hook, ver render mas abajo
    }
    loadPredictionsMode({ groupId: group.id })
  }

  return (
    <section>
      <h1 className="text-display-md">Configuración del Pickem</h1>

      <h2 className="text-display-sm">Visibilidad de tablas</h2>
      <p className="text-body-sm text-muted">
        Por defecto, las tablas de posiciones solo las ven los usuarios que tuvieron acceso semanal aprobado alguna
        vez en la temporada. Activa esto para que cualquier miembro del grupo pueda verlas, aunque nunca haya
        jugado.
      </p>
      {group && (
        <label className="text-body-sm">
          <input type="checkbox" checked={visible ?? false} disabled={saveStatus === 'pending'} onChange={handleToggle} />{' '}
          Mostrar tablas a todos los miembros del grupo
        </label>
      )}

      <h2 className="text-display-sm" style={{ marginTop: 32 }}>
        Pronósticos de partidos
      </h2>
      <p className="text-body-sm text-muted">
        Muestra en la hoja de picks el % de victoria de cada equipo según ESPN y por cuántos puntos es favorito.
        Con &quot;Después del cierre del pick&quot; cada pronóstico aparece hasta que ya no se puede cambiar el pick de
        ese partido, para que nadie solo copie al favorito.
      </p>
      {group && (
        <label className="text-body-sm">
          Pronósticos:{' '}
          <select
            value={predictionsMode ?? 'off'}
            disabled={predictionsMode === null || saveModeStatus === 'pending'}
            onChange={handlePredictionsModeChange}
          >
            {PREDICTIONS_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {saveModeError && <p role="alert">No se pudo guardar: {saveModeError.message}</p>}
    </section>
  )
}
