import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/presentation/components/Icon/Icon'
import styles from './AdminHomePage.module.css'

interface AdminAction {
  to: string
  icon: IconName
  title: string
  description: string
}

interface AdminSection {
  title: string
  actions: AdminAction[]
}

/** Agrupado por lo que el admin necesita hacer, no por orden de creación — así sabe donde buscar cada cosa. */
const SECTIONS: AdminSection[] = [
  {
    title: 'Usuarios y accesos',
    actions: [
      { to: '/admin/users', icon: 'users', title: 'Usuarios', description: 'Alta, edición y baja de cuentas' },
      { to: '/admin/members', icon: 'users', title: 'Miembros', description: 'Ver y remover usuarios del grupo' },
      { to: '/admin/access-requests', icon: 'ticket', title: 'Accesos a otros módulos', description: 'Playoffs, cuando este disponible' },
    ],
  },
  {
    title: 'Calendario y resultados',
    actions: [
      { to: '/admin/sync', icon: 'refresh', title: 'Sincronizar con ESPN', description: 'Importa calendario y resultados automáticamente' },
      { to: '/admin/games/new', icon: 'calendar', title: 'Agregar partido a mano', description: 'Respaldo si ESPN no tiene un partido' },
      { to: '/admin/results', icon: 'trophy', title: 'Cargar resultados a mano', description: 'Corregir el resultado de un partido' },
    ],
  },
  {
    title: 'Quinielas',
    actions: [
      { to: '/admin/pickem/settings', icon: 'trophy', title: 'Visibilidad de tablas', description: 'Mostrar u ocultar las tablas del pickem a quien no jugó' },
      { to: '/admin/survivor', icon: 'refresh', title: 'Recalcular Survivor', description: 'Plan B si el recalculo automático no corrio' },
    ],
  },
  {
    title: 'Supervision',
    actions: [
      { to: '/admin/picks', icon: 'search', title: 'Ver picks de usuarios', description: 'Pickem semanal y Survivor, por semana o por usuario' },
    ],
  },
]

/** Panel de administrador (tarea 7.3: solo accesible para platform_admins via RequireAdmin). */
export function AdminHomePage() {
  return (
    <section>
      <span className="kicker">
        <Icon name="gear" size={13} /> Solo administradores
      </span>
      <h1 className="text-display-lg">Panel de administrador</h1>
      <p className="text-body-sm text-muted">Elige una sección para gestionar el grupo.</p>

      {SECTIONS.map((section) => (
        <div key={section.title} className={styles.section}>
          <h2 className={styles.sectionTitle}>{section.title}</h2>
          <ul className={styles.list}>
            {section.actions.map((action) => (
              <li key={action.to}>
                <Link to={action.to} className={`${styles.row} glass-surface glass-interactive`}>
                  <span className={styles.iconWrap}>
                    <Icon name={action.icon} size={18} />
                  </span>
                  <span className={styles.body}>
                    <span className={styles.title}>{action.title}</span>
                    <span className={styles.description}>{action.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
