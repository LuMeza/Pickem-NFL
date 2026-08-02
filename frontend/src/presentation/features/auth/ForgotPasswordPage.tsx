import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useRequestPasswordReset } from '@/presentation/hooks/useRequestPasswordReset'
import { Icon } from '@/presentation/components/Icon/Icon'

/** Pantalla pública para solicitar el correo de recuperación de contraseña. */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const { status, error, run } = useRequestPasswordReset()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await run({ email })
    } catch {
      // el error ya queda reflejado en `error` via useAsyncAction
    }
  }

  if (status === 'success') {
    return (
      <div className="auth-screen">
        <section className="glass-surface">
          <span className="auth-kicker">
            <Icon name="mail" size={13} /> Revisa tu correo
          </span>
          <h1 className="text-display-lg">Listo</h1>
          <p className="text-body-sm text-muted" style={{ marginBottom: 20 }}>
            Si {email} tiene una cuenta, te enviamos un link para elegir una nueva contraseña.
          </p>
          <Link to="/login">Volver al login</Link>
        </section>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <section className="glass-surface">
        <span className="auth-kicker">
          <Icon name="football" size={13} /> Pickem NFL
        </span>
        <h1 className="text-display-lg">Olvide mi contraseña</h1>
        <p className="text-body-sm text-muted" style={{ marginBottom: 20 }}>
          Escribe tu correo y te mandamos un link para elegir una nueva contraseña.
        </p>
        <form onSubmit={handleSubmit}>
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <button type="submit" style={{ width: '100%' }} disabled={status === 'pending'}>
            {status === 'pending' ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>
        {error && <p role="alert">No se pudo enviar el correo: {error.message}</p>}
        <p className="text-body-sm text-muted" style={{ marginTop: 16 }}>
          <Link to="/login">Volver al login</Link>
        </p>
      </section>
    </div>
  )
}
