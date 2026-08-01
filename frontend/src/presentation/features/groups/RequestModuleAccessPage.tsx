import { useEffect } from 'react'
import { useDefaultGroup } from '@/presentation/hooks/useDefaultGroup'
import { useGetProfile } from '@/presentation/hooks/useGetProfile'
import { useGetModuleAccessStatus } from '@/presentation/hooks/useGetModuleAccessStatus'
import { useRequestModuleAccess } from '@/presentation/hooks/useRequestModuleAccess'
import { Icon } from '@/presentation/components/Icon/Icon'
import type { GameModule, ModuleAccessStatus } from '@/core/ports/ModuleAccessRepository'
import styles from './RequestModuleAccessPage.module.css'

// Pickem Semanal ya NO usa este modelo generico de module_access — tiene su
// propia pantalla de acceso semanal (ver /pickem/acceso y
// openspec/changes/modulo-pickem-semanal specs/acceso-semanal-pickem).
// Survivor termino siendo de acceso implicito por ser miembro del grupo unico
// (sin solicitud, ver openspec/changes/modulo-survivor). Playoffs, cuando se
// implemente, decide por su cuenta si requiere aprobacion explicita (listado
// aqui) o tambien acceso implicito — ver design.md decision 4 de base-plataforma.
const MODULES: { id: GameModule; label: string }[] = []

const BADGE_CLASS: Record<ModuleAccessStatus, string> = {
  solicitado: styles.badgeSolicitado ?? '',
  aprobado: styles.badgeAprobado ?? '',
  rechazado: styles.badgeRechazado ?? '',
}

const BADGE_LABEL: Record<ModuleAccessStatus, string> = {
  solicitado: 'Pendiente de aprobacion',
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

/** Tarea 5.5 (base-plataforma): un miembro solicita acceso a un modulo opcional (grupo unico global). */
export function RequestModuleAccessPage() {
  const { data: group, run: loadGroup } = useDefaultGroup()
  const { data: profile, run: loadProfile } = useGetProfile()

  useEffect(() => {
    loadGroup()
    loadProfile()
  }, [loadGroup, loadProfile])

  return (
    <section>
      <span className="kicker">
        <Icon name="ticket" size={13} /> Modulos opcionales
      </span>
      <h1 className="text-display-md">Acceso a modulos</h1>
      <p className="text-body-sm text-muted">
        El Pickem Semanal se solicita semana a semana desde su propia pantalla. Survivor esta disponible para
        cualquier miembro del grupo sin solicitud. Playoffs, cuando exista, va a aparecer aqui si requiere
        aprobacion.
      </p>
      {group && profile && MODULES.length > 0 && (
        <ul className={styles.list}>
          {MODULES.map((module) => (
            <ModuleRow key={module.id} groupId={group.id} userId={profile.userId} module={module.id} label={module.label} />
          ))}
        </ul>
      )}
      {MODULES.length === 0 && (
        <p className="text-body-sm text-muted">Todavia no hay modulos que requieran solicitud aqui.</p>
      )}
    </section>
  )
}
