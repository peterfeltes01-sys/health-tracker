import { describe, it, expect } from 'vitest'
import { computeStrengthProfile } from './analytics'
import type { WorkoutSession } from '../../types/workout'
import type { MovementFamily } from '../../types/training'

const NOW = new Date('2026-06-10T12:00:00Z')

function makeFamily(): MovementFamily {
  return {
    id: 'fam-push',
    name: 'Horizontal Push',
    bucket: 'push',
    primaryMuscles: ['chest' as const],
    levels: ['ex-easy', 'ex-mid', 'ex-hard'],
  }
}

function makeSession(date: string, exerciseId: string, reps: number, level: number): WorkoutSession {
  return {
    id: `s-${date}`,
    date,
    startedAt: 0,
    completedAt: 0,
    durationSeconds: 1800,
    mode: 'bodyweight',
    performed: [],
    totalPoints: 10,
    bonusPoints: 0,
    loggedSets: [
      {
        exerciseId,
        exerciseName: `Ex ${exerciseId}`,
        movementFamilyId: 'fam-push',
        variationLevel: level,
        primaryMusclesSnapshot: ['chest' as const],
        secondaryMusclesSnapshot: [],
        reps,
        rir: null,
        isWarmup: false,
        restTakenSeconds: null,
        timestamp: date + 'T10:00:00Z',
      },
    ],
  }
}

describe('computeStrengthProfile', () => {
  it('returns empty profile for no history', () => {
    const r = computeStrengthProfile([], [makeFamily()], NOW)
    expect(r.exercises).toEqual([])
    expect(r.radarData).toEqual([])
  })

  it('computes current level correctly', () => {
    const history = [makeSession('2026-06-01', 'ex-mid', 10, 2)]
    const r = computeStrengthProfile(history, [makeFamily()], NOW)
    expect(r.exercises[0].currentLevel).toBe(2)
  })

  it('trend is up when reps increase significantly in last 4 weeks', () => {
    const history = [
      makeSession('2026-05-20', 'ex-mid', 8, 2),
      makeSession('2026-06-05', 'ex-mid', 13, 2),
    ]
    const r = computeStrengthProfile(history, [makeFamily()], NOW)
    expect(r.exercises[0].trend).toBe('up')
  })

  it('trend is flat when level stable', () => {
    const history = [
      makeSession('2026-05-20', 'ex-mid', 10, 2),
      makeSession('2026-06-05', 'ex-mid', 11, 2),
    ]
    const r = computeStrengthProfile(history, [makeFamily()], NOW)
    expect(r.exercises[0].trend).toBe('flat')
  })

  it('radarData contains muscle entry for trained exercise in family', () => {
    const history = [makeSession('2026-06-05', 'ex-mid', 10, 2)]
    const r = computeStrengthProfile(history, [makeFamily()], NOW)
    expect(r.radarData.some((d) => d.muscle === 'chest')).toBe(true)
  })

  it('recent reps are returned', () => {
    const history = [
      makeSession('2026-06-01', 'ex-mid', 8, 2),
      makeSession('2026-06-03', 'ex-mid', 10, 2),
    ]
    const r = computeStrengthProfile(history, [makeFamily()], NOW)
    expect(r.exercises[0].recentReps.length).toBeGreaterThan(0)
  })
})
