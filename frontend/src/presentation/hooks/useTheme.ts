import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

/** Misma llave que el script de index.html que fija el tema antes del primer pintado. */
const STORAGE_KEY = 'pickem-theme'

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/**
 * Tema claro/oscuro. Sin elección guardada sigue al sistema operativo (y
 * cambia en vivo si el sistema cambia); al alternar, la elección queda
 * guardada en el navegador y deja de seguir al sistema.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? systemTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const handleChange = () => {
      if (!readStoredTheme()) setTheme(systemTheme())
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Sin almacenamiento (modo privado): el cambio aplica solo a esta sesión.
      }
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
