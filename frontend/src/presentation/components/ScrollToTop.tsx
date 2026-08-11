import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** React Router no resetea el scroll al navegar entre rutas: sin esto, una pantalla nueva
 * puede aparecer con el contenido fuera de vista si la anterior estaba scrolleada hacia abajo. */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
