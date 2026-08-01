const PATHS = {
  home: (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </>
  ),
  football: (
    <>
      <ellipse cx="12" cy="12" rx="9" ry="6" transform="rotate(-40 12 12)" />
      <path d="M7.5 16.5l9-9" />
      <path d="M10.8 13.2l1.3-1.3M12.9 11.1l1.3-1.3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.4 7.4 0 0 0 0-2l2-1.5-2-3.4-2.3.9a7.6 7.6 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.6 7.6 0 0 0-1.7 1l-2.3-.9-2 3.4L6.6 11a7.4 7.4 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9c.5.4 1.1.8 1.7 1l.4 2.5h4l.4-2.5c.6-.2 1.2-.6 1.7-1l2.3.9 2-3.4-2-1.5z" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M13 6v2M13 11v2M13 16v2" strokeDasharray="2 2" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 14v3M9 21h6M9.5 21c0-2 .8-3 2.5-4 1.7 1 2.5 2 2.5 4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c.9-3.2 3.2-5 6-5s5.1 1.8 6 5" />
      <path d="M16 4.3a3 3 0 0 1 0 5.8" />
      <path d="M18 15c2 .5 3.3 2 4 5" />
    </>
  ),
  userPlus: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c1.3-4 4.3-6 7-6s5.7 2 7 6" />
      <path d="M18 8h4M20 6v4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M4 12a8 8 0 0 1 14-5.3L21 9" />
      <path d="M21 5v4h-4" />
      <path d="M20 12a8 8 0 0 1-14 5.3L3 15" />
      <path d="M3 19v-4h4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 6 8.5-6" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </>
  ),
  check: <path d="M4 12.5l5.5 5.5L20 6" />,
} as const

export type IconName = keyof typeof PATHS

export interface IconProps {
  name: IconName
  size?: number
}

/**
 * Set de iconos propio (trazo, estilo outline) para reemplazar los emojis de
 * navegacion y tarjetas de acceso — ver propuesta de rediseno "Cancha
 * Nocturna". Sin dependencia externa: son pocos iconos, coherente con la
 * decision de no sumar un framework de terceros (ver sistema-diseno-ui
 * design.md decision 1).
 */
export function Icon({ name, size = 20 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
