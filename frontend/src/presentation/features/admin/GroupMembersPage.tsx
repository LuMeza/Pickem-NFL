import { useCallback, useEffect, useState } from 'react'
import { useSession } from '@/presentation/hooks/SessionContext'
import { useListGroupMembers } from '@/presentation/hooks/useListGroupMembers'
import { useRemoveGroupMember } from '@/presentation/hooks/useRemoveGroupMember'
import type { GroupMember } from '@/core/ports/GroupRepository'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { Modal } from '@/presentation/components/Modal/Modal'
import styles from './GroupMembersPage.module.css'

/** Tarea 5.4 (base-plataforma): listar y remover miembros del grupo único. */
export function GroupMembersPage() {
  const { data: group } = useSession().group
  const { status, data: members, error, run: loadMembers } = useListGroupMembers()
  const { status: removeStatus, error: removeError, run: removeMember } = useRemoveGroupMember()
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null)

  const reload = useCallback(() => {
    if (group) loadMembers({ groupId: group.id })
  }, [group, loadMembers])

  useEffect(() => {
    reload()
  }, [reload])

  async function handleConfirmRemove() {
    if (!group || !memberToRemove) return
    try {
      await removeMember({ groupId: group.id, userId: memberToRemove.userId })
      setMemberToRemove(null)
      reload()
    } catch {
      // el error queda reflejado via removeError, ver Modal mas abajo
    }
  }

  return (
    <section>
      <span className="kicker">
        <Icon name="users" size={13} /> Grupo
      </span>
      <h1 className="text-display-lg">Miembros</h1>
      {status === 'pending' && <LoadingSpinner variant="inline" />}
      {error && <p role="alert">No se pudieron cargar los miembros.</p>}
      {members && members.length === 0 && <EmptyState message={EMPTY_STATE_COPY.groupWithoutMembers} />}
      <ul className={styles.list}>
        {members?.map((member) => (
          <li key={member.userId} className={`${styles.row} glass-surface`}>
            <span className={styles.info}>
              <span className={styles.name}>{member.displayName}</span>
              <span className={styles.joined}>Desde {member.joinedAt.toLocaleDateString()}</span>
            </span>
            <button type="button" className="button-secondary" onClick={() => setMemberToRemove(member)}>
              Remover
            </button>
          </li>
        ))}
      </ul>

      <Modal open={memberToRemove !== null} onClose={() => setMemberToRemove(null)}>
        {memberToRemove && (
          <div className="glass-surface" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className="text-display-sm">Remover miembro</h2>
            <p>
              Esto saca a <strong>{memberToRemove.displayName}</strong> del grupo y de todos los módulos del pickem
              (Pickem Semanal, Survivor). No se puede deshacer.
            </p>
            {removeError && <p role="alert">No se pudo remover: {removeError.message}</p>}
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={handleConfirmRemove} disabled={removeStatus === 'pending'}>
                {removeStatus === 'pending' ? 'Removiendo...' : 'Remover definitivamente'}
              </button>
              <button type="button" className="button-secondary" onClick={() => setMemberToRemove(null)}>
                Cancelar
              </button>
            </span>
          </div>
        )}
      </Modal>
    </section>
  )
}
