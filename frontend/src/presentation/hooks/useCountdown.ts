import { useEffect, useState } from 'react'

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return '00:00:00'
  const totalSeconds = Math.floor(msRemaining / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

/** Cuenta regresiva HH:MM:SS del header (tarea 2.3). */
export function useCountdown(target: Date | null): string | null {
  const [label, setLabel] = useState<string | null>(target ? formatCountdown(target.getTime() - Date.now()) : null)

  useEffect(() => {
    if (!target) {
      setLabel(null)
      return
    }
    setLabel(formatCountdown(target.getTime() - Date.now()))
    const intervalId = setInterval(() => {
      setLabel(formatCountdown(target.getTime() - Date.now()))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [target])

  return label
}
