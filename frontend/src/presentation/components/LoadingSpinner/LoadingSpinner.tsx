import styles from './LoadingSpinner.module.css'

export interface LoadingSpinnerProps {
  label?: string
}

/** Spinner con degradado lime->dorado — reemplaza los "Cargando..." de texto plano en los guards de ruta. */
export function LoadingSpinner({ label }: LoadingSpinnerProps) {
  return (
    <div className={styles.wrapper} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  )
}
