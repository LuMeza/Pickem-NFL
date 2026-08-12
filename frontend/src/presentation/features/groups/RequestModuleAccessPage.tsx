import { useEffect } from 'react'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useGetModuleAccessStatus } from '@/presentation/hooks/useGetModuleAccessStatus'
import { useRequestModuleAccess } from '@/presentation/hooks/useRequestModuleAccess'
import { Icon } from '@/presentation/components/Icon/Icon'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import type { GameModule, ModuleAccessStatus } from '@/core/ports/ModuleAccessRepository'
import styles from './RequestModuleAccessPage.module.css'

// Pickem Semanal ya NO usa este modelo genérico de module_access — el acceso
// es libre para cualquier miembro del grupo, sin solicitud ni aprobación
// (ver openspec/changes/modulo-pickem-semanal specs/acceso-semanal-pickem).
// Survivor terminó siendo de acceso implícito por ser miembro del grupo único
// (sin solicitud, ver openspec/changes/modulo-survivor). Playoffs, cuando se
// implemente, decide por su cuenta si requiere aprobación explícita (listado
// aquí) o también acceso implícito — ver design.md decision 4 de base-plataforma.
const MODULES: { id: GameModule; label: string }[] = []

const BADGE_CLASS: Record<ModuleAccessStatus, string> = {
  solicitado: styles.badgeSolicitado ?? '',
  aprobado: styles.badgeAprobado ?? '',
  rechazado: styles.badgeRechazado ?? '',
}

const BADGE_LABEL: Record<ModuleAccessStatus, string> = {
  solicitado: 'Pendiente de aprobación',
  aprobado: 'Activo',
  rechazado: 'Rechazado',
}

function ModuleRow({ groupId, userId, module, label }: { groupId: string; userId: string; module: GameModule; label: string }) {
  const { data: moduleStatus, run: loadStatus } = useGetModuleAccessStatus()
  const { status: requestStatus, run: requestAccess } = useRequestModuleAccess()

  useEffect(() => {
    loadStatus({ groupId, userId, module })
  }, [loadStatus, groupId, userId, module])

  async function handleRequest() {
    await requestAccess({ groupId, userId, module })
    await loadStatus({ groupId, userId, module })
  }

  return (
    <li className={`${styles.row} glass-surface`}>
      <span className={styles.label}>{label}</span>
      {moduleStatus ? (
        <span className={`${styles.badge} ${BADGE_CLASS[moduleStatus]}`}>{BADGE_LABEL[moduleStatus]}</span>
      ) : (
        <button type="button" onClick={handleRequest} disabled={requestStatus === 'pending'}>
          Solicitar acceso
        </button>
      )}
    </li>
  )
}

/** Tarea 5.5 (base-plataforma): un miembro solicita acceso a un módulo opcional (grupo único global). */
export function RequestModuleAccessPage() {
  const { data: group } = useSession().group
  const { data: profile } = useSession().profile

  return (
    <section>
      <span className="kicker">
        <Icon name="ticket" size={13} /> Módulos opcionales
      </span>
      <h1 className="text-display-md">Acceso a módulos</h1>
      <p className="text-body-sm text-muted">
        El Pickem Semanal se solicita semana a semana desde su propia pantalla. Survivor está disponible para
        cualquier miembro del grupo sin solicitud. Playoffs, cuando exista, va a aparecer aquí si requiere
        aprobación.
      </p>
      {group && profile && MODULES.length > 0 && (
        <ul className={styles.list}>
          {MODULES.map((module) => (
            <ModuleRow key={module.id} groupId={group.id} userId={profile.userId} module={module.id} label={module.label} />
          ))}
        </ul>
      )}
      {MODULES.length === 0 && (
        <EmptyState message="Todavía no hay módulos que requieran solicitud aquí — vuelve cuando se habilite Playoffs." />
      )}
    </section>
  )
}
