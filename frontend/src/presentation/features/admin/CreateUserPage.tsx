import { useState, type FormEvent } from 'react'
import { useCreateUser } from '@/presentation/hooks/useCreateUser'
import { Icon } from '@/presentation/components/Icon/Icon'

/** Tarea 4.2 (base-plataforma): alta de usuario por el administrador. */
export function CreateUserPage() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const { status, data, error, run } = useCreateUser()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await run({ email, displayName })
    setEmail('')
    setDisplayName('')
  }

  return (
    <section>
      <span className="kicker">
        <Icon name="userPlus" size={13} /> Alta de usuario
      </span>
      <h1 className="text-display-md">Dar de alta un usuario</h1>
      <form onSubmit={handleSubmit} className="glass-surface" style={{ padding: 20, marginTop: 16, maxWidth: 420 }}>
        <label>
          Correo
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Nombre visible
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
        </label>
        <button type="submit" disabled={status === 'pending'}>
          {status === 'pending' ? 'Creando...' : 'Crear usuario'}
        </button>
      </form>
      {error && <p role="alert">No se pudo crear el usuario: {error.message}</p>}
      {data && (
        <div role="status" className="glass-surface" style={{ padding: 16, marginTop: 16 }}>
          <p>Usuario creado. Entrega esta contrasena provisional fuera de la plataforma (no se muestra de nuevo):</p>
          <p className="text-mono-md" style={{ color: 'var(--accent-lime)' }}>
            {data.provisionalPassword}
          </p>
        </div>
      )}
    </section>
  )
}
