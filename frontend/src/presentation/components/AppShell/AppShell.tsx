import type { ReactNode } from 'react'
import { Header, type HeaderProps } from './Header'
import { NavBar, type NavItem } from './NavBar'
import styles from './AppShell.module.css'

export interface AppShellProps {
  navItems: NavItem[]
  header?: HeaderProps
  children: ReactNode
}

/**
 * Tarea 2.2 (sistema-diseno-ui): layout compartido (header + nav + slot de
 * contenido) que envuelve las pantallas de la app — ver design.md decision
 * 5. Un único componente, no reimplementado por pantalla/módulo.
 */
export function AppShell({ navItems, header, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.body}>
        <NavBar items={navItems} />
        <div className={styles.main}>
          <Header {...header} />
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </div>
  )
}
