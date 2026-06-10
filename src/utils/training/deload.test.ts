import { describe, it, expect } from 'vitest'
import { detectDeload } from './deload'
import type { WorkoutSession } from '../../types/workout'
import type { ReadinessCheckin } from '../../types/training'

const NOW = new Date('2026-06-10T12:00:00Z')

function makeSession(date: string, exerciseId: string, reps = 10, level = 2): WorkoutSession {
  return {
    id: `s-${date}`,
    date,
    startedAt: 0,
    completedAt: new Date(date + 'T11:00:00Z').getTime(),
    durationSeconds: 1800,
    mode: 'bodyweight',
    performed: [],
    totalPoints: 10,
    bonusPoints: 0,
    loggedSets: [
      {
        exerciseId,
        exerciseName: 'Ex',
        movementFamilyId: null,
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

function makeCheckin(date: string, score: number): ReadinessCheckin {
  return {
    id: `rc-${date}`,
    userId: 'u1',
    date,
    score,
    band: score >= 70 ? 'FULL' : score >= 40 ? 'REDUCED' : 'RECOVERY',
    factors: { frequency: score, recovery: score },
    createdAt: new Date(date).getTime(),
  }
}

describe('detectDeload', () => {
  it('returns null with no history', () => {
    expect(detectDeload([], [], undefined, NOW)).toBeNull()
  })

  it('respects 4-week cooldown', () => {
    const recent = NOW.getTime() - 7 * 24 * 3_600_000
    const history = [
      makeSession('2026-05-15', 'ex-1', 10),
      makeSession('2026-05-22', 'ex-1', 10),
      makeSession('2026-05-29', 'ex-1', 10),
      makeSession('2026-06-05', 'ex-2', 10),
      makeSession('2026-05-15', 'ex-2', 10),
      makeSession('2026-05-22', 'ex-2', 10),
    ]
    expect(detectDeload(history, [], recent, NOW)).toBeNull()
  })

  it('triggers on stagnation with >= 2 stagnant exercises', () => {
    // Same reps and level for 2 weeks for 2 exercises → stagnation
    const history: WorkoutSession[] = []
    for (const date of ['2026-05-27', '2026-06-03', '2026-06-08']) {
      history.push(makeSession(date, 'ex-1', 10, 2))
      history.push(makeSession(date, 'ex-2', 8, 1))
    }
    const r = detectDeload(history, [], undefined, NOW)
    expect(r?.trigger).toBe('stagnation')
  })

  it('does not trigger stagnation when exercise progressed', () => {
    const history: WorkoutSession[] = [
      makeSession('2026-05-27', 'ex-1', 8, 1),
      makeSession('2026-06-03', 'ex-1', 12, 2), // higher level → progression
    ]
    // Only 1 exercise trained → need >= 2 stagnant
    const r = detectDeload(history, [], undefined, NOW)
    expect(r).toBeNull()
  })

  it('triggers on negative readiness trend', () => {
    const checkins: ReadinessCheckin[] = [
      // older week: high scores
      makeCheckin('2026-05-27', 80),
      makeCheckin('2026-05-28', 82),
      makeCheckin('2026-05-29', 78),
      makeCheckin('2026-05-30', 80),
      // recent week: low scores
      makeCheckin('2026-06-03', 55),
      makeCheckin('2026-06-04', 52),
      makeCheckin('2026-06-05', 50),
      makeCheckin('2026-06-06', 48),
    ]
    // Need at least some recent sessions for the trigger
    const history: WorkoutSession[] = [
      makeSession('2026-06-03', 'ex-1', 10),
      makeSession('2026-06-05', 'ex-1', 10),
    ]
    const r = detectDeload(history, checkins, undefined, NOW)
    expect(r?.trigger).toBe('readiness_trend')
  })
})
