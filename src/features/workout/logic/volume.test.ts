import { describe, it, expect } from 'vitest'
import { computeWeeklyVolume } from './volume'
import type { LoggedSet } from '../../../types/training'

function makeSet(overrides: Partial<LoggedSet> = {}): LoggedSet {
  return {
    exerciseId: 'ex-1',
    exerciseName: 'Test',
    movementFamilyId: null,
    variationLevel: null,
    primaryMusclesSnapshot: ['chest'],
    secondaryMusclesSnapshot: ['triceps'],
    reps: 10,
    rir: null,
    isWarmup: false,
    restTakenSeconds: null,
    timestamp: '2026-06-04T10:00:00.000Z',
    ...overrides,
  }
}

const WINDOW_START = new Date('2026-06-01T00:00:00.000Z')
const WINDOW_END = new Date('2026-06-07T23:59:59.999Z')

describe('computeWeeklyVolume', () => {
  it('counts primary muscle as 1.0 and secondary as 0.5', () => {
    const sets = [makeSet()]
    const { byMuscle } = computeWeeklyVolume(sets, WINDOW_START, WINDOW_END)
    const chest = byMuscle.find((m) => m.muscle === 'chest')
    const triceps = byMuscle.find((m) => m.muscle === 'triceps')
    expect(chest?.sets).toBe(1)
    expect(triceps?.sets).toBe(0.5)
  })

  it('respects custom secondaryWeight', () => {
    const sets = [makeSet()]
    const { byMuscle } = computeWeeklyVolume(sets, WINDOW_START, WINDOW_END, 0.25)
    const triceps = byMuscle.find((m) => m.muscle === 'triceps')
    expect(triceps?.sets).toBe(0.25)
  })

  it('excludes warmup sets', () => {
    const sets = [makeSet({ isWarmup: true })]
    const { byMuscle } = computeWeeklyVolume(sets, WINDOW_START, WINDOW_END)
    expect(byMuscle).toHaveLength(0)
  })

  it('excludes sets outside window', () => {
    const sets = [makeSet({ timestamp: '2026-05-30T10:00:00.000Z' })]
    const { byMuscle } = computeWeeklyVolume(sets, WINDOW_START, WINDOW_END)
    expect(byMuscle).toHaveLength(0)
  })

  it('correctly aggregates multiple sets', () => {
    const sets = [makeSet(), makeSet(), makeSet()]
    const { byMuscle } = computeWeeklyVolume(sets, WINDOW_START, WINDOW_END)
    const chest = byMuscle.find((m) => m.muscle === 'chest')
    expect(chest?.sets).toBe(3)
  })

  it('aggregates into buckets correctly', () => {
    // chest → push, triceps → push
    const sets = [makeSet()]
    const { byBucket } = computeWeeklyVolume(sets, WINDOW_START, WINDOW_END)
    const push = byBucket.find((b) => b.bucket === 'push')
    expect(push?.sets).toBeCloseTo(1.5) // 1.0 chest + 0.5 triceps
  })

  it('returns empty arrays for no sets', () => {
    const { byMuscle, byBucket } = computeWeeklyVolume([], WINDOW_START, WINDOW_END)
    expect(byMuscle).toHaveLength(0)
    expect(byBucket).toHaveLength(0)
  })

  it('window boundaries are inclusive', () => {
    const atStart = makeSet({ timestamp: WINDOW_START.toISOString() })
    const atEnd = makeSet({ timestamp: WINDOW_END.toISOString() })
    const { byMuscle } = computeWeeklyVolume([atStart, atEnd], WINDOW_START, WINDOW_END)
    const chest = byMuscle.find((m) => m.muscle === 'chest')
    expect(chest?.sets).toBe(2)
  })
})
