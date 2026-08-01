import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChangePassword } from '@/presentation/hooks/useChangePassword'
import { Icon } from '@/presentation/components/Icon/Icon'

/** Pantalla a la que llega el link de recuperacion de contrasena por correo. */
export function ResetPasswordPage() {
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
          <Icon name="lock" size={13} /> Nueva contrasena
        </span>
        <h1 className="text-display-lg">Elige tu nueva contrasena</h1>
        <p className="text-body-sm text-muted" style={{ marginBottom: 20 }}>
          Escribe tu nueva contrasena para volver a entrar.
        </p>
        <form onSubmit={handleSubmit}>
          <label>
            Nueva contrasena
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
            Confirmar contrasena
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
            {status === 'pending' ? 'Guardando...' : 'Guardar contrasena'}
          </button>
        </form>
        {mismatch && <p role="alert">Las contrasenas no coinciden.</p>}
        {error && <p role="alert">No se pudo actualizar la contrasena: {error.message}</p>}
      </section>
    </div>
  )
}
