import { useEffect, useState, type FormEvent } from 'react'
import type { AdminUserSummary } from '@/core/ports'
import { useListUsers } from '@/presentation/hooks/useListUsers'
import { useUpdateUser } from '@/presentation/hooks/useUpdateUser'
import { useDeleteUser } from '@/presentation/hooks/useDeleteUser'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { Modal } from '@/presentation/components/Modal/Modal'
import styles from './GroupMembersPage.module.css'

/** Panel admin: editar o eliminar usuarios existentes (alta vive en /admin/users/new). */
export function AdminUsersPage() {
  const { status, data: users, error, run: loadUsers } = useListUsers()
  const { status: updateStatus, error: updateError, run: runUpdateUser } = useUpdateUser()
  const { status: deleteStatus, error: deleteError, run: runDeleteUser } = useDeleteUser()

  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [userToDelete, setUserToDelete] = useState<AdminUserSummary | null>(null)

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  function startEditing(user: AdminUserSummary) {
    setEditingUserId(user.userId)
    setEditDisplayName(user.displayName)
    setEditEmail(user.email)
  }

  function cancelEditing() {
    setEditingUserId(null)
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault()
    if (!editingUserId) return
    await runUpdateUser({ userId: editingUserId, displayName: editDisplayName, email: editEmail })
    setEditingUserId(null)
    loadUsers()
  }

  async function handleConfirmDelete() {
    if (!userToDelete) return
    await runDeleteUser({ userId: userToDelete.userId })
    setUserToDelete(null)
    loadUsers()
  }

  return (
    <section>
      <span className="kicker">
        <Icon name="users" size={13} /> Usuarios
      </span>
      <h1 className="text-display-lg">Editar o eliminar usuarios</h1>

      {status === 'pending' && <LoadingSpinner variant="inline" />}
      {error && <p role="alert">No se pudieron cargar los usuarios.</p>}
      {users && users.length === 0 && <EmptyState message={EMPTY_STATE_COPY.groupWithoutMembers} />}

      <ul className={styles.list}>
        {users?.map((user) =>
          editingUserId === user.userId ? (
            <li key={user.userId} className={`${styles.row} glass-surface`}>
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                <label>
                  Nombre visible
                  <input value={editDisplayName} onChange={(event) => setEditDisplayName(event.target.value)} required />
                </label>
                <label>
                  Correo
                  <input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} required />
                </label>
                {updateError && <p role="alert">No se pudo guardar: {updateError.message}</p>}
                <span style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={updateStatus === 'pending'}>
                    {updateStatus === 'pending' ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" className="button-secondary" onClick={cancelEditing}>
                    Cancelar
                  </button>
                </span>
              </form>
            </li>
          ) : (
            <li key={user.userId} className={`${styles.row} glass-surface`}>
              <span className={styles.info}>
                <span className={styles.name}>{user.displayName}</span>
                <span className={styles.joined}>{user.email}</span>
              </span>
              <span style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button type="button" className="button-secondary" onClick={() => startEditing(user)}>
                  Editar
                </button>
                <button type="button" className="button-secondary" onClick={() => setUserToDelete(user)}>
                  Eliminar
                </button>
              </span>
            </li>
          ),
        )}
      </ul>

      <Modal open={userToDelete !== null} onClose={() => setUserToDelete(null)}>
        {userToDelete && (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className="text-display-sm">Eliminar usuario</h2>
            <p>
              Esto elimina la cuenta de <strong>{userToDelete.displayName}</strong> ({userToDelete.email}) de forma
              definitiva, junto con su acceso a todos los grupos. No se puede deshacer.
            </p>
            {deleteError && <p role="alert">No se pudo eliminar: {deleteError.message}</p>}
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={handleConfirmDelete} disabled={deleteStatus === 'pending'}>
                {deleteStatus === 'pending' ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
              <button type="button" className="button-secondary" onClick={() => setUserToDelete(null)}>
                Cancelar
              </button>
            </span>
          </div>
        )}
      </Modal>
    </section>
  )
}
