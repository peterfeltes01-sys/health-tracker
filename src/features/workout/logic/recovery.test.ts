import { describe, it, expect } from 'vitest'
import { computeRecovery } from './recovery'
import type { LoggedSet } from '../../../types/training'

function makeSet(date: string, muscles: string[] = ['chest'], overrides: Partial<LoggedSet> = {}): LoggedSet {
  return {
    exerciseId: 'ex-1',
    exerciseName: 'Test',
    movementFamilyId: null,
    variationLevel: null,
    primaryMusclesSnapshot: muscles as LoggedSet['primaryMusclesSnapshot'],
    secondaryMusclesSnapshot: [],
    reps: 10,
    rir: null,
    isWarmup: false,
    restTakenSeconds: null,
    timestamp: `${date}T10:00:00.000Z`,
    ...overrides,
  }
}

describe('computeRecovery', () => {
  const now = new Date('2026-06-06T12:00:00.000Z')

  it('returns fresh when last trained more than recoveryHours ago', () => {
    // trained 3 days ago
    const sets = Array.from({ length: 5 }, () => makeSet('2026-06-03'))
    const result = computeRecovery(sets, now)
    const chest = result.find((r) => r.muscle === 'chest')
    expect(chest?.state).toBe('fresh')
  })

  it('returns recently_trained within recoveryHours with hard sets', () => {
    // trained yesterday with 5 hard sets
    const sets = Array.from({ length: 5 }, () => makeSet('2026-06-05'))
    const result = computeRecovery(sets, now)
    const chest = result.find((r) => r.muscle === 'chest')
    expect(chest?.state).toBe('recently_trained')
  })

  it('returns recovering within recoveryHours with few sets', () => {
    // trained yesterday with only 2 sets (< hardSetThreshold of 4)
    const sets = [makeSet('2026-06-05'), makeSet('2026-06-05')]
    const result = computeRecovery(sets, now)
    const chest = result.find((r) => r.muscle === 'chest')
    expect(chest?.state).toBe('recovering')
  })

  it('excludes warmup sets', () => {
    const sets = [makeSet('2026-06-05', ['chest'], { isWarmup: true })]
    const result = computeRecovery(sets, now)
    expect(result).toHaveLength(0)
  })

  it('returns empty array for no sets', () => {
    const result = computeRecovery([], now)
    expect(result).toHaveLength(0)
  })

  it('uses most recent date per muscle when multiple sessions', () => {
    const oldSets = Array.from({ length: 5 }, () => makeSet('2026-06-02'))
    const recentSets = [makeSet('2026-06-05'), makeSet('2026-06-05')]
    const result = computeRecovery([...oldSets, ...recentSets], now)
    const chest = result.find((r) => r.muscle === 'chest')
    expect(chest?.lastTrained).toBe('2026-06-05')
    // 2 sets from June 5 < threshold → recovering, not recently_trained
    expect(chest?.state).toBe('recovering')
  })

  it('tracks multiple muscles independently', () => {
    const chestSets = Array.from({ length: 5 }, () => makeSet('2026-06-05', ['chest']))
    const legSets = [makeSet('2026-06-03', ['quads'])]
    const result = computeRecovery([...chestSets, ...legSets], now)
    const chest = result.find((r) => r.muscle === 'chest')
    const quads = result.find((r) => r.muscle === 'quads')
    expect(chest?.state).toBe('recently_trained')
    expect(quads?.state).toBe('fresh')
  })
})
