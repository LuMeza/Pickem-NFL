import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from '@/presentation/components/Icon/Icon'
import styles from './NavBar.module.css'

export interface NavItem {
  to: string
  label: string
  icon: IconName
}

export interface NavBarProps {
  items: NavItem[]
}

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return isActive ? `${styles.navLink ?? ''} ${styles.navLinkActive ?? ''}` : (styles.navLink ?? '')
}

/**
 * Tareas 2.4 y 2.5 (sistema-diseno-ui): navegacion inferior fija en
 * mobile/tablet, sidebar fijo en desktop — ambos markups viven en el DOM y
 * se alternan por CSS segun breakpoint (ver NavBar.module.css), asi la
 * ruta activa se resuelve una sola vez.
 */
export function NavBar({ items }: NavBarProps) {
  const links = items.map((item) => (
    <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClassName}>
      <span className={styles.icon}>
        <Icon name={item.icon} size={20} />
      </span>
      <span>{item.label}</span>
    </NavLink>
  ))

  return (
    <>
      <nav className={styles.bottomNav} aria-label="Navegacion principal">
        {links}
      </nav>
      <nav className={styles.sidebar} aria-label="Navegacion principal">
        {links}
      </nav>
    </>
  )
}
