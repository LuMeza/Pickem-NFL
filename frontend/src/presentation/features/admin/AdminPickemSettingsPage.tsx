import { useEffect } from 'react'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useGetPickemTablesVisibility } from '@/presentation/hooks/useGetPickemTablesVisibility'
import { useSetPickemTablesVisibility } from '@/presentation/hooks/useSetPickemTablesVisibility'
import { Icon } from '@/presentation/components/Icon/Icon'

/** Tarea 4.5 (modulo-pickem-semanal): habilitar/deshabilitar que usuarios sin acceso semanal aprobado vean las tablas de posiciones. */
export function AdminPickemSettingsPage() {
  const { data: group } = useSession().group
  const { data: visible, run: loadVisibility } = useGetPickemTablesVisibility()
  const { status: saveStatus, run: saveVisibility } = useSetPickemTablesVisibility()

  useEffect(() => {
    if (group) loadVisibility({ groupId: group.id })
  }, [group, loadVisibility])

  async function handleToggle(event: React.ChangeEvent<HTMLInputElement>) {
    if (!group) return
    await saveVisibility({ groupId: group.id, visible: event.target.checked })
    loadVisibility({ groupId: group.id })
  }

  return (
    <section>
      <span className="kicker">
        <Icon name="trophy" size={13} /> Pickem semanal
      </span>
      <h1 className="text-display-md">Visibilidad de tablas</h1>
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
    </section>
  )
}
