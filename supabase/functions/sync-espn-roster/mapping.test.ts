import { describe, expect, it } from 'vitest'
import {
  applyInjuryReport,
  parseEspnInjuryReport,
  parseEspnRoster,
  type EspnInjuryReportResponse,
  type EspnRosterResponse,
  type ParsedInjury,
  type ParsedPlayer,
} from './mapping'

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
      {
        espnAthleteId: '1',
        fullName: 'Patrick Mahomes',
        jerseyNumber: '15',
        position: 'QB',
        unit: 'offense',
        heightIn: null,
        weightLbs: null,
        birthDate: null,
        age: null,
        college: null,
        experienceYears: null,
        status: null,
        injuryStatus: null,
        injuryDetail: null,
      },
      {
        espnAthleteId: '2',
        fullName: 'Chris Jones',
        jerseyNumber: '95',
        position: 'DT',
        unit: 'defense',
        heightIn: null,
        weightLbs: null,
        birthDate: null,
        age: null,
        college: null,
        experienceYears: null,
        status: null,
        injuryStatus: null,
        injuryDetail: null,
      },
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
      {
        espnAthleteId: '1',
        fullName: 'Jugador Valido',
        jerseyNumber: '10',
        position: null,
        unit: 'offense',
        heightIn: null,
        weightLbs: null,
        birthDate: null,
        age: null,
        college: null,
        experienceYears: null,
        status: null,
        injuryStatus: null,
        injuryDetail: null,
      },
    ])
  })

  it('devuelve lista vacia si no hay grupos de athletes', () => {
    expect(parseEspnRoster({})).toEqual([])
  })
})

describe('parseEspnInjuryReport', () => {
  it('aplana el reporte agrupado por equipo en una lista por atleta', () => {
    const response: EspnInjuryReportResponse = {
      injuries: [
        {
          injuries: [
            { athlete: { id: '1' }, status: 'Questionable', details: { type: 'Ankle' } },
            { athlete: { id: '2' }, status: 'Out', details: { type: 'Knee' } },
          ],
        },
        {
          injuries: [{ athlete: { id: '3' }, status: 'Doubtful' }],
        },
      ],
    }

    expect(parseEspnInjuryReport(response)).toEqual([
      { espnAthleteId: '1', injuryStatus: 'Questionable', injuryDetail: 'Ankle' },
      { espnAthleteId: '2', injuryStatus: 'Out', injuryDetail: 'Knee' },
      { espnAthleteId: '3', injuryStatus: 'Doubtful', injuryDetail: null },
    ])
  })

  it('descarta entradas sin athlete.id o sin status', () => {
    const response: EspnInjuryReportResponse = {
      injuries: [
        {
          injuries: [
            { athlete: { id: '1' }, status: 'Questionable' },
            { status: 'Out' },
            { athlete: { id: '2' } },
            { athlete: {}, status: 'Doubtful' },
          ],
        },
      ],
    }

    expect(parseEspnInjuryReport(response)).toEqual([{ espnAthleteId: '1', injuryStatus: 'Questionable', injuryDetail: null }])
  })

  it('devuelve lista vacia si no hay equipos o el reporte esta vacio', () => {
    expect(parseEspnInjuryReport({})).toEqual([])
    expect(parseEspnInjuryReport({ injuries: [{}] })).toEqual([])
  })
})

describe('applyInjuryReport', () => {
  const basePlayer: ParsedPlayer = {
    espnAthleteId: '1',
    fullName: 'Jugador Uno',
    jerseyNumber: '10',
    position: 'QB',
    unit: 'offense',
    heightIn: null,
    weightLbs: null,
    birthDate: null,
    age: null,
    college: null,
    experienceYears: null,
    status: 'Active',
    injuryStatus: null,
    injuryDetail: null,
  }

  it('agrega la designacion semanal a los jugadores con match por espnAthleteId', () => {
    const injuries: ParsedInjury[] = [{ espnAthleteId: '1', injuryStatus: 'Questionable', injuryDetail: 'Ankle' }]

    expect(applyInjuryReport([basePlayer], injuries)).toEqual([
      { ...basePlayer, injuryStatus: 'Questionable', injuryDetail: 'Ankle' },
    ])
  })

  it('deja al jugador sin cambios si no hay match', () => {
    const injuries: ParsedInjury[] = [{ espnAthleteId: '999', injuryStatus: 'Out', injuryDetail: null }]

    expect(applyInjuryReport([basePlayer], injuries)).toEqual([basePlayer])
  })

  it('devuelve la misma lista si no hay lesiones para aplicar', () => {
    expect(applyInjuryReport([basePlayer], [])).toEqual([basePlayer])
  })
})
