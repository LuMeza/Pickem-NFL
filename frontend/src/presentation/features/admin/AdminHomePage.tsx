import { ActionCard } from '@/presentation/components/ActionCard/ActionCard'
import { Icon } from '@/presentation/components/Icon/Icon'

/** Panel de administrador (tarea 7.3: solo accesible para platform_admins via RequireAdmin). */
export function AdminHomePage() {
  return (
    <section>
      <span className="kicker">
        <Icon name="gear" size={13} /> Solo administradores
      </span>
      <h1 className="text-display-lg">Panel de administrador</h1>
      <div className="card-grid">
        <ActionCard to="/admin/sync" icon="refresh" title="Sincronizar con ESPN" description="Importa calendario y resultados automaticamente" />
        <ActionCard to="/admin/users/new" icon="userPlus" title="Dar de alta un usuario" description="Correo, nombre y contrasena provisional" />
        <ActionCard to="/admin/members" icon="users" title="Miembros" description="Ver y remover usuarios del grupo" />
        <ActionCard to="/admin/pickem/access-requests" icon="ticket" title="Accesos al pickem semanal" description="Aprobar o rechazar solicitudes por semana" />
        <ActionCard to="/admin/access-requests" icon="ticket" title="Accesos a otros modulos" description="Survivor y Playoffs, cuando esten disponibles" />
        <ActionCard to="/admin/games/new" icon="calendar" title="Agregar partido a mano" description="Respaldo si ESPN no tiene un partido" />
        <ActionCard to="/admin/results" icon="trophy" title="Cargar resultados a mano" description="Corregir el resultado de un partido" />
        <ActionCard to="/admin/pickem/settings" icon="trophy" title="Visibilidad de tablas" description="Mostrar u ocultar las tablas del pickem a quien no jugo" />
      </div>
    </section>
  )
}
