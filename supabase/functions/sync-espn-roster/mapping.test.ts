import { describe, expect, it } from 'vitest'
import { parseEspnRoster, type EspnRosterResponse } from './mapping'

describe('parseEspnRoster', () => {
  it('aplana los grupos offense/defense/specialTeam en una sola lista', () => {
    const response: EspnRosterResponse = {
      athletes: [
        {
          position: 'offense',
          items: [{ id: '1', fullName: 'Patrick Mahomes', jersey: '15', position: { abbreviation: 'QB' } }],
        },
        {
          position: 'defense',
          items: [{ id: '2', fullName: 'Chris Jones', jersey: '95', position: { abbreviation: 'DT' } }],
        },
      ],
    }

    expect(parseEspnRoster(response)).toEqual([
      { espnAthleteId: '1', fullName: 'Patrick Mahomes', jerseyNumber: '15', position: 'QB', unit: 'offense' },
      { espnAthleteId: '2', fullName: 'Chris Jones', jerseyNumber: '95', position: 'DT', unit: 'defense' },
    ])
  })

  it('descarta jugadores sin id o sin nombre', () => {
    const response: EspnRosterResponse = {
      athletes: [
        {
          position: 'offense',
          items: [
            { id: '1', fullName: 'Jugador Valido', jersey: '10' },
            { fullName: 'Sin id' },
            { id: '2' },
          ],
        },
      ],
    }

    expect(parseEspnRoster(response)).toEqual([
      { espnAthleteId: '1', fullName: 'Jugador Valido', jerseyNumber: '10', position: null, unit: 'offense' },
    ])
  })

  it('devuelve lista vacia si no hay grupos de athletes', () => {
    expect(parseEspnRoster({})).toEqual([])
  })
})
