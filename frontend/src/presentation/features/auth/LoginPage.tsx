import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSignIn } from '@/presentation/hooks/useSignIn'
import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './LoginPage.module.css'

/** Tarea 4.3 (base-plataforma): login con correo + contraseña. */
export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { status, error, run } = useSignIn()
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      const result = await run({ email, password })
      navigate(result.mustChangePassword ? '/change-password' : '/', { replace: true })
    } catch {
      // el error ya queda reflejado en `error` via useAsyncAction
    }
  }

  return (
    <div className="auth-screen">
      <section className="glass-surface">
        <span className="auth-kicker">
          <Icon name="football" size={13} /> Pickem NFL
        </span>
        <h1 className={`text-display-lg ${styles.title}`}>Bienvenido</h1>
        <p className={`text-body-sm text-muted ${styles.subtitle}`}>Entra con la cuenta que te dio el administrador.</p>
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
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className={styles.submit} disabled={status === 'pending'}>
            {status === 'pending' ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        {error && <p role="alert">Correo o contraseña incorrectos.</p>}
        <p className="text-body-sm text-muted" style={{ marginTop: 16 }}>
          <Link to="/forgot-password">Olvide mi contraseña</Link>
        </p>
      </section>
    </div>
  )
}
