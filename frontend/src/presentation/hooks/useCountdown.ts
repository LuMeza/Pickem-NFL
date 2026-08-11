import { useEffect, useState } from 'react'

const MS_PER_DAY = 86_400_000
const MS_PER_HOUR = 3_600_000
const MS_PER_MINUTE = 60_000
const MS_PER_SECOND = 1000

const TICK_MS = 1000

function pad(value: number, size = 2): string {
  return value.toString().padStart(size, '0')
}

function formatCountdown(msRemaining: number): string {
  const clamped = Math.max(msRemaining, 0)
  const days = Math.floor(clamped / MS_PER_DAY)
  const hours = Math.floor((clamped % MS_PER_DAY) / MS_PER_HOUR)
  const minutes = Math.floor((clamped % MS_PER_HOUR) / MS_PER_MINUTE)
  const seconds = Math.floor((clamped % MS_PER_MINUTE) / MS_PER_SECOND)
  const time = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  return days > 0 ? `${days}d ${time}` : time
}

/** Cuenta regresiva d HH:MM:SS, compartida por el header y Survivor (tarea 2.3). */
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
    }, TICK_MS)
    return () => clearInterval(intervalId)
  }, [target])

  return label
}
