import { useEffect, useState } from 'react'
import type { AdminUserSummary } from '@/core/ports'
import { useListUsers } from '@/presentation/hooks/useListUsers'
import { useCreateUser } from '@/presentation/hooks/useCreateUser'
import { useUpdateUser } from '@/presentation/hooks/useUpdateUser'
import { useDeleteUser } from '@/presentation/hooks/useDeleteUser'
import { useSetPlatformAdmin } from '@/presentation/hooks/useSetPlatformAdmin'
import { useResendWelcomeEmail } from '@/presentation/hooks/useResendWelcomeEmail'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { Icon } from '@/presentation/components/Icon/Icon'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'
import { Modal } from '@/presentation/components/Modal/Modal'
import { UserFormModal } from './UserFormModal'
import tableStyles from '@/presentation/styles/adminTable.module.css'
import styles from './AdminUsersPage.module.css'

type FormModalState = { mode: 'create' } | { mode: 'edit'; user: AdminUserSummary } | null

/** Panel admin: alta, edición y baja de usuarios en una sola pantalla. */
export function AdminUsersPage() {
  const { status, data: users, error, run: loadUsers } = useListUsers()
  const { status: createStatus, error: createError, run: runCreateUser } = useCreateUser()
  const { status: updateStatus, error: updateError, run: runUpdateUser } = useUpdateUser()
  const { status: deleteStatus, error: deleteError, run: runDeleteUser } = useDeleteUser()
  const { error: setAdminError, run: runSetPlatformAdmin } = useSetPlatformAdmin()
  const {
    status: resendStatus,
    error: resendError,
    run: runResendWelcomeEmail,
  } = useResendWelcomeEmail()

  const [formModal, setFormModal] = useState<FormModalState>(null)
  const [createdResult, setCreatedResult] = useState<{ provisionalPassword: string; emailSent: boolean } | null>(
    null,
  )
  const [userToDelete, setUserToDelete] = useState<AdminUserSummary | null>(null)
  const [adminToRevoke, setAdminToRevoke] = useState<AdminUserSummary | null>(null)
  const [userToResend, setUserToResend] = useState<AdminUserSummary | null>(null)
  const [resendResult, setResendResult] = useState<{ provisionalPassword: string; emailSent: boolean } | null>(null)
  const [actioningUserId, setActioningUserId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  function openCreateModal() {
    setCreatedResult(null)
    setFormModal({ mode: 'create' })
  }

  function openEditModal(user: AdminUserSummary) {
    setFormModal({ mode: 'edit', user })
  }

  async function handleFormSubmit(values: { displayName: string; email: string }) {
    if (!formModal) return
    if (formModal.mode === 'create') {
      const result = await runCreateUser(values)
      setCreatedResult({ provisionalPassword: result.provisionalPassword, emailSent: result.emailSent })
      loadUsers()
    } else {
      await runUpdateUser({ userId: formModal.user.userId, displayName: values.displayName, email: values.email })
      setFormModal(null)
      loadUsers()
    }
  }

  async function handleConfirmDelete() {
    if (!userToDelete) return
    await runDeleteUser({ userId: userToDelete.userId })
    setUserToDelete(null)
    loadUsers()
  }

  function handleToggleAdmin(user: AdminUserSummary, nextValue: boolean) {
    if (nextValue) {
      void grantAdmin(user)
    } else {
      setAdminToRevoke(user)
    }
  }

  async function grantAdmin(user: AdminUserSummary) {
    setActioningUserId(user.userId)
    try {
      await runSetPlatformAdmin({ userId: user.userId, isAdmin: true })
      loadUsers()
    } finally {
      setActioningUserId(null)
    }
  }

  function closeResendModal() {
    setUserToResend(null)
    setResendResult(null)
  }

  async function handleConfirmResend() {
    if (!userToResend) return
    const result = await runResendWelcomeEmail({ userId: userToResend.userId })
    setResendResult({ provisionalPassword: result.provisionalPassword, emailSent: result.emailSent })
  }

  async function handleConfirmRevoke() {
    if (!adminToRevoke) return
    setActioningUserId(adminToRevoke.userId)
    try {
      await runSetPlatformAdmin({ userId: adminToRevoke.userId, isAdmin: false })
      setAdminToRevoke(null)
      loadUsers()
    } finally {
      setActioningUserId(null)
    }
  }

  const sortedUsers = users
    ? [...users].sort((a, b) => a.displayName.localeCompare(b.displayName, 'es', { sensitivity: 'base' }))
    : null

  const normalizedSearch = search.trim().toLowerCase()
  const visibleUsers = sortedUsers
    ? sortedUsers.filter(
        (user) =>
          user.displayName.toLowerCase().includes(normalizedSearch) ||
          user.email.toLowerCase().includes(normalizedSearch),
      )
    : null

  return (
    <section>
      <div className={styles.header}>
        <div>
          <span className="kicker">
            <Icon name="users" size={13} /> Usuarios
          </span>
          <h1 className="text-display-lg">Usuarios</h1>
        </div>
        <button type="button" onClick={openCreateModal}>
          Nuevo usuario
        </button>
      </div>

      {status === 'pending' && <LoadingSpinner variant="inline" />}
      {error && <p role="alert">No se pudieron cargar los usuarios.</p>}
      {adminToRevoke === null && setAdminError && (
        <p role="alert">No se pudo actualizar el admin: {setAdminError.message}</p>
      )}
      {users && users.length === 0 && <EmptyState message={EMPTY_STATE_COPY.groupWithoutMembers} />}

      {users && users.length > 0 && (
        <label className={styles.searchBox}>
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      )}

      {visibleUsers && visibleUsers.length === 0 && users && users.length > 0 && (
        <p className="text-body-sm text-muted">Ningún usuario coincide con "{search}".</p>
      )}

      {visibleUsers && visibleUsers.length > 0 && (
        <div className={`${tableStyles.panel} ${tableStyles.tableScroll}`}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Admin</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.userId}>
                  <td>{user.displayName}</td>
                  <td>{user.email}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={user.isAdmin}
                      disabled={actioningUserId === user.userId}
                      aria-label={`Admin: ${user.displayName}`}
                      onChange={(event) => handleToggleAdmin(user, event.target.checked)}
                    />
                  </td>
                  <td>
                    <span className={tableStyles.actionsCell}>
                      <button
                        type="button"
                        className={tableStyles.iconButton}
                        aria-label={`Editar ${user.displayName}`}
                        onClick={() => openEditModal(user)}
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        type="button"
                        className={tableStyles.iconButton}
                        aria-label={`Reenviar bienvenida a ${user.displayName}`}
                        onClick={() => setUserToResend(user)}
                      >
                        <Icon name="mail" size={16} />
                      </button>
                      <button
                        type="button"
                        className={`${tableStyles.iconButton} ${tableStyles.iconButtonDanger}`}
                        aria-label={`Eliminar ${user.displayName}`}
                        onClick={() => setUserToDelete(user)}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserFormModal
        open={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        initialUser={formModal?.mode === 'edit' ? formModal.user : null}
        status={formModal?.mode === 'create' ? createStatus : updateStatus}
        error={formModal?.mode === 'create' ? createError : updateError}
        createdResult={createdResult}
        onSubmit={handleFormSubmit}
        onClose={() => setFormModal(null)}
      />

      <Modal open={userToDelete !== null} onClose={() => setUserToDelete(null)}>
        {userToDelete && (
          <div className="glass-surface" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
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

      <Modal open={adminToRevoke !== null} onClose={() => setAdminToRevoke(null)}>
        {adminToRevoke && (
          <div className="glass-surface" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className="text-display-sm">Quitar administrador</h2>
            <p>
              <strong>{adminToRevoke.displayName}</strong> perderá acceso al panel de administrador de inmediato.
            </p>
            {setAdminError && <p role="alert">No se pudo quitar: {setAdminError.message}</p>}
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={handleConfirmRevoke} disabled={actioningUserId === adminToRevoke.userId}>
                {actioningUserId === adminToRevoke.userId ? 'Quitando...' : 'Quitar administrador'}
              </button>
              <button type="button" className="button-secondary" onClick={() => setAdminToRevoke(null)}>
                Cancelar
              </button>
            </span>
          </div>
        )}
      </Modal>

      <Modal open={userToResend !== null} onClose={closeResendModal}>
        {userToResend && (
          <div className="glass-surface" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className="text-display-sm">Reenviar bienvenida</h2>
            {resendResult ? (
              <>
                <p>
                  {resendResult.emailSent
                    ? `Le enviamos una nueva contraseña provisional a ${userToResend.email}. Guárdala también por las dudas (no se muestra de nuevo):`
                    : 'No se pudo enviar el correo. Entrega esta contraseña provisional fuera de la plataforma (no se muestra de nuevo):'}
                </p>
                <p className="text-mono-md" style={{ color: 'var(--accent-lime)' }}>
                  {resendResult.provisionalPassword}
                </p>
                <button type="button" onClick={closeResendModal}>
                  Cerrar
                </button>
              </>
            ) : (
              <>
                <p>
                  Esto genera una nueva contraseña provisional para <strong>{userToResend.displayName}</strong> (
                  {userToResend.email}) y le reenvía el correo de bienvenida. La contraseña actual deja de
                  funcionar.
                </p>
                {resendError && <p role="alert">No se pudo reenviar: {resendError.message}</p>}
                <span style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={handleConfirmResend} disabled={resendStatus === 'pending'}>
                    {resendStatus === 'pending' ? 'Enviando...' : 'Reenviar bienvenida'}
                  </button>
                  <button type="button" className="button-secondary" onClick={closeResendModal}>
                    Cancelar
                  </button>
                </span>
              </>
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}
