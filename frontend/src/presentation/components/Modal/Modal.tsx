import { useEffect, useRef, type ReactNode } from 'react'
import styles from './Modal.module.css'

export interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** `sheet`: en pantallas angostas sale como hoja pegada abajo (selectores largos); en anchas queda centrado. */
  variant?: 'center' | 'sheet'
}

/** Modal genérico sobre <dialog> nativo — da backdrop y cierre con ESC/click-afuera gratis, sin depender de una librería de UI. */
export function Modal({ open, onClose, children, variant = 'center' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${variant === 'sheet' ? styles.sheet : ''}`}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      {children}
    </dialog>
  )
}
