import { useId } from 'react'

export interface LogoProps {
  size?: number
  className?: string
}

/** Isotipo de Pickem NFL: balon con degradado lime->dorado y costuras (misma elipse que Icon "football"). */
export function Logo({ size = 28, className }: LogoProps) {
  const gradientId = useId()

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent-gold)" />
          <stop offset="100%" stopColor="var(--accent-lime)" />
        </linearGradient>
      </defs>
      <ellipse cx="12" cy="12" rx="9" ry="6" transform="rotate(-40 12 12)" fill={`url(#${gradientId})`} />
      <path
        d="M7.5 16.5l9-9M10.8 13.2l1.3-1.3M12.9 11.1l1.3-1.3"
        stroke="var(--bg-base)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
