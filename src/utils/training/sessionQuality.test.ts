import { describe, it, expect } from 'vitest'
import { computeSessionQuality } from './sessionQuality'
import type { WorkoutSession } from '../../types/workout'
import type { LoggedSet } from '../../types/training'

function makeSession(opts: {
  loggedSets?: Partial<LoggedSet>[]
  performed?: WorkoutSession['performed']
}): WorkoutSession {
  const loggedSets: LoggedSet[] = (opts.loggedSets ?? []).map((s) => ({
    exerciseId: 'ex-1',
    exerciseName: 'Test',
    movementFamilyId: null,
    variationLevel: 1,
    primaryMusclesSnapshot: [],
    secondaryMusclesSnapshot: [],
    reps: 10,
    rir: null,
    isWarmup: false,
    restTakenSeconds: null,
    timestamp: '2026-06-10T10:00:00Z',
    ...s,
  }))

  const performed: WorkoutSession['performed'] = opts.performed ?? [
    {
      exerciseId: 'ex-1',
      nameSnapshot: 'Test',
      basePointsSnapshot: 10,
      targetSnapshot: { type: 'reps', sets: 3, reps: 10 },
      actual: { sets: 3, reps: 10 },
      pointsEarned: 10,
      metTarget: true,
    },
  ]

  return {
    id: 's-1',
    date: '2026-06-10',
    startedAt: 0,
    completedAt: 0,
    durationSeconds: 1800,
    mode: 'bodyweight',
    performed,
    totalPoints: 10,
    bonusPoints: 0,
    loggedSets,
  }
}

describe('computeSessionQuality', () => {
  it('returns 50 for empty session (all neutral)', () => {
    const s = makeSession({ loggedSets: [] })
    expect(computeSessionQuality(s)).toBe(50)
  })

  it('score is between 0 and 100', () => {
    const s = makeSession({ loggedSets: [{ reps: 5, rir: 0 }] })
    const score = computeSessionQuality(s)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('perfect sets (all target reps, RIR 2) yields high score', () => {
    const sets = Array.from({ length: 3 }, () => ({ reps: 10, rir: 2 }))
    const s = makeSession({ loggedSets: sets })
    expect(computeSessionQuality(s)).toBeGreaterThanOrEqual(80)
  })

  it('no RIR data → RIR component neutral (50)', () => {
    const sets = [{ reps: 10, rir: null }, { reps: 10, rir: null }]
    const s = makeSession({ loggedSets: sets })
    // goal achievement ~100, rir ~50, pause ~50
    const score = computeSessionQuality(s)
    expect(score).toBeGreaterThan(60)
  })

  it('all reps below target → lower goal achievement', () => {
    const sets = [{ reps: 5 }, { reps: 5 }, { reps: 5 }]
    const s = makeSession({ loggedSets: sets })
    expect(computeSessionQuality(s)).toBeLessThan(50)
  })

  it('ignores warmup sets for scoring', () => {
    const sets = [{ reps: 3, isWarmup: true }, { reps: 10, rir: 2 }]
    const s = makeSession({ loggedSets: sets })
    expect(computeSessionQuality(s)).toBeGreaterThan(50)
  })
})
