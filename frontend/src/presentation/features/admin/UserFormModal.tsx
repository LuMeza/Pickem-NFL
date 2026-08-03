import { useEffect, useState, type FormEvent } from 'react'
import type { AdminUserSummary } from '@/core/ports'
import { Modal } from '@/presentation/components/Modal/Modal'

export interface UserFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  initialUser?: AdminUserSummary | null
  status: 'idle' | 'pending' | 'success' | 'error'
  error: Error | null
  createdResult?: { provisionalPassword: string; emailSent: boolean } | null
  onSubmit: (values: { displayName: string; email: string }) => void
  onClose: () => void
}

/** Form de alta/edición de usuario, reutilizado en ambos modos dentro de un Modal (ver AdminUsersPage). */
export function UserFormModal({
  open,
  mode,
  initialUser,
  status,
  error,
  createdResult,
  onSubmit,
  onClose,
}: UserFormModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!open) return
    setDisplayName(initialUser?.displayName ?? '')
    setEmail(initialUser?.email ?? '')
  }, [open, initialUser])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit({ displayName, email })
  }

  const showCreatedResult = mode === 'create' && createdResult !== null && createdResult !== undefined

  return (
    <Modal open={open} onClose={onClose}>
      <div className="glass-surface" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 className="text-display-sm">{mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}</h2>

        {showCreatedResult ? (
          <>
            <p>
              {createdResult.emailSent
                ? 'Usuario creado. Le enviamos la contraseña provisional por correo. Guárdala también por las dudas (no se muestra de nuevo):'
                : 'Usuario creado, pero no se pudo enviar el correo. Entrega esta contraseña provisional fuera de la plataforma (no se muestra de nuevo):'}
            </p>
            <p className="text-mono-md" style={{ color: 'var(--accent-lime)' }}>
              {createdResult.provisionalPassword}
            </p>
            <button type="button" onClick={onClose}>
              Cerrar
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label>
              Nombre visible
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
            </label>
            <label>
              Correo
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            {error && <p role="alert">No se pudo guardar: {error.message}</p>}
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={status === 'pending'}>
                {status === 'pending' ? 'Guardando...' : mode === 'create' ? 'Crear usuario' : 'Guardar'}
              </button>
              <button type="button" className="button-secondary" onClick={onClose}>
                Cancelar
              </button>
            </span>
          </form>
        )}
      </div>
    </Modal>
  )
}
