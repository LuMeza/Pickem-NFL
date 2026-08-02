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
        <span className={styles.watermark} aria-hidden="true">12</span>
        <span className="auth-kicker">
          <Icon name="football" size={13} /> Pickem NFL
        </span>
        <h1 className={`text-display-lg ${styles.title}`}>Bienvenido</h1>
        <p className={`text-body-sm text-muted ${styles.subtitle}`}>Entra con la cuenta que te dio el administrador.</p>
        <form onSubmit={handleSubmit}>
          <label>
            Correo
            <div className={styles.inputWrap}>
              <Icon name="mail" size={16} className={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className={styles.inputWithIcon}
              />
            </div>
          </label>
          <label>
            Contraseña
            <div className={styles.inputWrap}>
              <Icon name="lock" size={16} className={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className={styles.inputWithIcon}
              />
            </div>
          </label>
          <button type="submit" className={styles.submit} disabled={status === 'pending'}>
            <Icon name="football" size={16} />
            {status === 'pending' ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        {error && <p role="alert">Correo o contraseña incorrectos.</p>}
        <p className={styles.footer}>
          <Link to="/forgot-password" className={styles.forgotLink}>
            Olvidé mi contraseña
            <Icon name="arrowLeft" size={14} className={styles.forgotIcon} />
          </Link>
        </p>
      </section>
    </div>
  )
}
