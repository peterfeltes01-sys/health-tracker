import { describe, it, expect } from 'vitest'
import { detectPR, getAllPRs } from './pr'
import type { WorkoutSession } from '../../types/workout'
import type { LoggedSet } from '../../types/training'

function makeLoggedSet(opts: Partial<LoggedSet> = {}): LoggedSet {
  return {
    exerciseId: 'ex-1',
    exerciseName: 'Pushup',
    movementFamilyId: 'fam-1',
    variationLevel: 2,
    primaryMusclesSnapshot: ['chest' as const],
    secondaryMusclesSnapshot: [],
    reps: 10,
    rir: null,
    isWarmup: false,
    restTakenSeconds: null,
    timestamp: '2026-06-10T10:00:00Z',
    ...opts,
  }
}

function makeSession(date: string, sets: Partial<LoggedSet>[]): WorkoutSession {
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
    loggedSets: sets.map((s) => makeLoggedSet(s)),
  }
}

describe('detectPR', () => {
  it('is a PR when history is empty (first session)', () => {
    const set = makeLoggedSet({ reps: 10, variationLevel: 1 })
    const r = detectPR(set, [])
    expect(r).not.toBeNull()
    expect(r?.reps).toBe(10)
  })

  it('is a PR when reps exceed all-time best at same level', () => {
    const history = [makeSession('2026-06-01', [{ reps: 8, variationLevel: 2 }])]
    const set = makeLoggedSet({ reps: 12, variationLevel: 2 })
    expect(detectPR(set, history)).not.toBeNull()
  })

  it('is not a PR when reps are equal to best', () => {
    const history = [makeSession('2026-06-01', [{ reps: 10, variationLevel: 2 }])]
    const set = makeLoggedSet({ reps: 10, variationLevel: 2 })
    expect(detectPR(set, history)).toBeNull()
  })

  it('is not a PR when reps are below best', () => {
    const history = [makeSession('2026-06-01', [{ reps: 12, variationLevel: 2 }])]
    const set = makeLoggedSet({ reps: 10, variationLevel: 2 })
    expect(detectPR(set, history)).toBeNull()
  })

  it('is a PR when advancing to higher variation level', () => {
    const history = [makeSession('2026-06-01', [{ reps: 12, variationLevel: 2 }])]
    const set = makeLoggedSet({ reps: 8, variationLevel: 3 })
    expect(detectPR(set, history)).not.toBeNull()
  })

  it('is not a PR for warmup sets', () => {
    const set = makeLoggedSet({ reps: 15, isWarmup: true })
    expect(detectPR(set, [])).toBeNull()
  })

  it('handles null variationLevel (treated as 0)', () => {
    const set = makeLoggedSet({ reps: 10, variationLevel: null })
    expect(detectPR(set, [])).not.toBeNull()
  })
})

describe('getAllPRs', () => {
  it('returns empty array for no history', () => {
    expect(getAllPRs([])).toEqual([])
  })

  it('returns one PR per exercise', () => {
    const history = [
      makeSession('2026-06-01', [{ exerciseId: 'ex-1', reps: 10, variationLevel: 2 }]),
      makeSession('2026-06-05', [{ exerciseId: 'ex-1', reps: 12, variationLevel: 2 }]),
      makeSession('2026-06-05', [{ exerciseId: 'ex-2', reps: 8, variationLevel: 1 }]),
    ]
    const prs = getAllPRs(history)
    expect(prs.length).toBe(2)
    const ex1 = prs.find((p) => p.exerciseId === 'ex-1')
    expect(ex1?.reps).toBe(12)
  })

  it('sorted by date descending', () => {
    const history = [
      makeSession('2026-06-01', [{ exerciseId: 'ex-1', reps: 10, variationLevel: 1 }]),
      makeSession('2026-06-05', [{ exerciseId: 'ex-2', reps: 8, variationLevel: 1 }]),
    ]
    const prs = getAllPRs(history)
    expect(prs[0].date >= prs[1].date).toBe(true)
  })
})
