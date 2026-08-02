import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChangePassword } from '@/presentation/hooks/useChangePassword'
import { Icon } from '@/presentation/components/Icon/Icon'

/** Tarea 4.4 (base-plataforma): cambio de contraseña obligatorio en el primer login. */
export function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mismatch, setMismatch] = useState(false)
  const { status, error, run } = useChangePassword()
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    await run({ newPassword })
    navigate('/', { replace: true })
  }

  return (
    <div className="auth-screen">
      <section className="glass-surface">
        <span className="auth-kicker">
          <Icon name="lock" size={13} /> Último paso
        </span>
        <h1 className="text-display-lg">Nueva contraseña</h1>
        <p className="text-body-sm text-muted" style={{ marginBottom: 20 }}>
          Debes cambiar tu contraseña provisional antes de continuar.
        </p>
        <form onSubmit={handleSubmit}>
          <label>
            Nueva contraseña
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirmar contraseña
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <button type="submit" style={{ width: '100%' }} disabled={status === 'pending'}>
            {status === 'pending' ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>
        {mismatch && <p role="alert">Las contraseñas no coinciden.</p>}
        {error && <p role="alert">No se pudo actualizar la contraseña: {error.message}</p>}
      </section>
    </div>
  )
}
