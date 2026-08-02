import { useCallback, useEffect } from 'react'
import { useDefaultGroup } from '@/presentation/hooks/useDefaultGroup'
import { useListGroupMembers } from '@/presentation/hooks/useListGroupMembers'
import { useRemoveGroupMember } from '@/presentation/hooks/useRemoveGroupMember'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import styles from './GroupMembersPage.module.css'

/** Tarea 5.4 (base-plataforma): listar y remover miembros del grupo único. */
export function GroupMembersPage() {
  const { data: group, run: loadGroup } = useDefaultGroup()
  const { status, data: members, error, run: loadMembers } = useListGroupMembers()
  const { run: removeMember } = useRemoveGroupMember()

  useEffect(() => {
    loadGroup()
  }, [loadGroup])

  const reload = useCallback(() => {
    if (group) loadMembers({ groupId: group.id })
  }, [group, loadMembers])

  useEffect(() => {
    reload()
  }, [reload])

  async function handleRemove(userId: string) {
    if (!group) return
    await removeMember({ groupId: group.id, userId })
    reload()
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
            <button type="button" className="button-secondary" onClick={() => handleRemove(member.userId)}>
              Remover
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
