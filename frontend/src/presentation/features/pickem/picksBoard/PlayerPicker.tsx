import { useMemo, useState } from 'react'
import { Modal } from '@/presentation/components/Modal/Modal'
import { Icon } from '@/presentation/components/Icon/Icon'
import { getInitials } from '@/core/rules/getInitials'
import { comparePicks, countCorrectPicks } from '@/core/rules/comparePicks'
import type { BoardUser } from './boardTypes'
import styles from './PicksBoard.module.css'

type SortMode = 'correct' | 'similar' | 'different'

const SORT_LABEL: Record<SortMode, string> = {
  correct: 'Por aciertos',
  similar: 'Más parecidos a ti',
  different: 'Más distintos',
}

interface PlayerPickerProps {
  open: boolean
  onClose: () => void
  me: BoardUser
  others: BoardUser[]
  gameIds: string[]
  selectedUserId: string | null
  onSelect: (userId: string) => void
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/** Hoja para elegir con quién compararte, con buscador y orden por aciertos, parecido o diferencia. */
export function PlayerPicker({ open, onClose, me, others, gameIds, selectedUserId, onSelect }: PlayerPickerProps) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('correct')

  const items = useMemo(() => {
    const rows = others.map((user) => ({
      user,
      correct: countCorrectPicks(user.cells),
      agree: comparePicks(gameIds, me.cells, user.cells).agreeCount,
    }))
    const byName = (a: (typeof rows)[number], b: (typeof rows)[number]) => a.user.displayName.localeCompare(b.user.displayName)
    return rows.sort((a, b) => {
      if (sort === 'similar') return b.agree - a.agree || byName(a, b)
      if (sort === 'different') return a.agree - b.agree || byName(a, b)
      return b.correct - a.correct || byName(a, b)
    })
  }, [others, gameIds, me, sort])

  const normalizedQuery = normalize(query.trim())
  const visible = normalizedQuery ? items.filter((item) => normalize(item.user.displayName).includes(normalizedQuery)) : items

  return (
    <Modal open={open} onClose={onClose} variant="sheet">
      <div className={`${styles.picker} glass-surface`}>
        <div className={styles.pickerHead}>
          <h2 className={styles.pickerTitle}>Comparar con</h2>
          <button type="button" className={styles.linkButton} onClick={onClose}>
            Cerrar
          </button>
        </div>

        <label className={styles.search}>
          <Icon name="search" size={18} />
          <input
            type="text"
            inputMode="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar jugador"
            aria-label="Buscar jugador"
          />
        </label>

        <div className={styles.sortChips} role="group" aria-label="Ordenar">
          {(Object.keys(SORT_LABEL) as SortMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={sort === mode}
              className={`${styles.filterChip} ${sort === mode ? styles.filterChipOn : ''}`}
              onClick={() => setSort(mode)}
            >
              {SORT_LABEL[mode]}
            </button>
          ))}
        </div>

        <ul className={styles.pickerList}>
          {visible.map(({ user, correct, agree }) => {
            const selected = user.userId === selectedUserId
            return (
              <li key={user.userId}>
                <button
                  type="button"
                  className={`${styles.pickerItem} ${selected ? styles.pickerItemOn : ''}`}
                  aria-pressed={selected}
                  onClick={() => {
                    onSelect(user.userId)
                    onClose()
                  }}
                >
                  <span className={styles.chipAvatar}>{getInitials(user.displayName)}</span>
                  <span className={styles.pickerName}>
                    {user.displayName}
                    <span className={styles.pickerMeta}>
                      {correct} {correct === 1 ? 'acierto' : 'aciertos'}
                    </span>
                  </span>
                  <span className={styles.pickerAgree}>
                    <strong>
                      {agree} de {gameIds.length}
                    </strong>
                    <span className={styles.pickerMeta}>coinciden</span>
                  </span>
                </button>
              </li>
            )
          })}
          {visible.length === 0 && <li className={styles.pickerEmpty}>Nadie con ese nombre.</li>}
        </ul>
      </div>
    </Modal>
  )
}
