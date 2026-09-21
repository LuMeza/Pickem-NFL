import styles from './SurvivorHowItWorks.module.css'

const STEPS = [
  {
    title: 'Elige un equipo',
    body: 'Uno por semana, antes de que empiece el primer partido. No puedes repetir equipo en toda la temporada.',
  },
  {
    title: 'Si gana, sigues',
    body: 'Tu equipo tiene que ganar. Si empata o pierde, quedas eliminado.',
  },
  {
    title: 'Si pierde, puedes revivir',
    body: 'Tienes la semana siguiente para elegir otro equipo. Cada vez que revives usas una vida extra (máximo 2).',
  },
]

/** Las reglas en tres pasos — un orden real (elegir → resultado → revivir), por eso van numerados. */
export function SurvivorHowItWorks({ defaultOpen }: { defaultOpen: boolean }) {
  return (
    <details className={`${styles.box} glass-surface`} open={defaultOpen}>
      <summary className={styles.summary}>¿Cómo funciona?</summary>
      <ol className={styles.steps}>
        {STEPS.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.number} aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <p className={styles.stepTitle}>{step.title}</p>
              <p className={styles.stepBody}>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </details>
  )
}
