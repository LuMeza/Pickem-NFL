import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Icon } from '@/presentation/components/Icon/Icon'
import styles from './SearchableSelect.module.css'

export interface SearchableSelectOption {
  value: string
  label: string
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
}

/**
 * Combobox liviano: campo de texto que filtra una lista larga a medida que
 * se escribe, con click para elegir — pensado para reemplazar un `<select>`
 * nativo cuando tiene muchas opciones (ej. usuarios del grupo) y hace falta
 * poder buscar en vez de solo desplazarse. Mismo patrón de "abrir/cerrar con
 * click afuera o Escape" que ya usa WeekSelector.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  emptyMessage = 'Sin resultados.',
}: SearchableSelectProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((option) => option.value === value)
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = normalizedQuery
    ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
    : options

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  function selectOption(option: SearchableSelectOption) {
    onChange(option.value)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
      inputRef.current?.blur()
    } else if (event.key === 'Enter' && filtered.length === 1) {
      event.preventDefault()
      selectOption(filtered[0]!)
    }
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <label className={styles.searchBox}>
        <Icon name="search" size={16} />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="searchable-select-listbox"
          placeholder={placeholder}
          value={isOpen ? query : (selected?.label ?? '')}
          onFocus={() => {
            setIsOpen(true)
            setQuery('')
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
        />
      </label>

      {isOpen && (
        <div id="searchable-select-listbox" className={`${styles.panel} glass-surface`} role="listbox">
          {filtered.length === 0 && <p className={styles.empty}>{emptyMessage}</p>}
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`${styles.option} ${option.value === value ? styles.optionActive : ''}`}
              onClick={() => selectOption(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
