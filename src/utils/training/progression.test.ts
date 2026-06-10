import { describe, it, expect } from 'vitest'
import { evaluateProgression, countConsecutiveDismissals } from './progression'
import type { WorkoutSession } from '../../types/workout'
import type { MovementFamily, ProgressionDecision } from '../../types/training'

function makeFamily(): MovementFamily {
  return {
    id: 'fam-push',
    name: 'Horizontal Push',
    bucket: 'push',
    primaryMuscles: ['chest'],
    levels: ['ex-easy', 'ex-mid', 'ex-hard'],
  }
}

function makeSession(date: string, exerciseId: string, reps: number, rir: number | null = null, targetReps = 10): WorkoutSession {
  return {
    id: `s-${date}`,
    date,
    startedAt: 0,
    completedAt: 0,
    durationSeconds: 1800,
    mode: 'bodyweight',
    performed: [
      {
        exerciseId,
        nameSnapshot: 'Test',
        basePointsSnapshot: 10,
        targetSnapshot: { type: 'reps', sets: 3, reps: targetReps },
        actual: { sets: 3, reps },
        pointsEarned: 10,
        metTarget: reps >= targetReps,
      },
    ],
    totalPoints: 10,
    bonusPoints: 0,
    loggedSets: Array.from({ length: 3 }, () => ({
      exerciseId,
      exerciseName: 'Test',
      movementFamilyId: 'fam-push',
      variationLevel: 2,
      primaryMusclesSnapshot: ['chest' as const],
      secondaryMusclesSnapshot: [],
      reps,
      rir,
      isWarmup: false,
      restTakenSeconds: null,
      timestamp: date + 'T10:00:00Z',
    })),
  }
}

function makeDecision(exerciseId: string, action: 'accepted' | 'dismissed', ts = Date.now()): ProgressionDecision {
  return { suggestionId: 'sg-1', exerciseId, action, timestamp: ts }
}

describe('evaluateProgression', () => {
  it('returns null with no history', () => {
    const r = evaluateProgression('ex-mid', 'Test', [], makeFamily())
    expect(r).toBeNull()
  })

  it('returns null when only 1 session (below threshold)', () => {
    const r = evaluateProgression('ex-mid', 'Test', [makeSession('2026-06-01', 'ex-mid', 10)], makeFamily())
    expect(r).toBeNull()
  })

  it('suggests advance after 2 sessions with target reps and RIR >= 2', () => {
    const sessions = [
      makeSession('2026-06-01', 'ex-mid', 10, 2),
      makeSession('2026-06-03', 'ex-mid', 10, 3),
    ]
    const r = evaluateProgression('ex-mid', 'Test', sessions, makeFamily())
    expect(r?.kind).toBe('advance')
    expect(r?.toExerciseId).toBe('ex-hard')
  })

  it('suggests advance after 2 sessions with target reps (no RIR data, fallback)', () => {
    const sessions = [
      makeSession('2026-06-01', 'ex-mid', 10, null),
      makeSession('2026-06-03', 'ex-mid', 10, null),
    ]
    const r = evaluateProgression('ex-mid', 'Test', sessions, makeFamily())
    expect(r?.kind).toBe('advance')
  })

  it('suggests regress after 2 sessions with failed reps', () => {
    const sessions = [
      makeSession('2026-06-01', 'ex-mid', 4, null, 10),
      makeSession('2026-06-03', 'ex-mid', 3, null, 10),
    ]
    const r = evaluateProgression('ex-mid', 'Test', sessions, makeFamily())
    expect(r?.kind).toBe('regress')
    expect(r?.toExerciseId).toBe('ex-easy')
  })

  it('does not regress when at first level', () => {
    const sessions = [
      makeSession('2026-06-01', 'ex-easy', 3, null, 10),
      makeSession('2026-06-03', 'ex-easy', 3, null, 10),
    ]
    const r = evaluateProgression('ex-easy', 'Test', sessions, makeFamily())
    expect(r).toBeNull()
  })

  it('does not advance without family', () => {
    const sessions = [
      makeSession('2026-06-01', 'ex-mid', 10, 2),
      makeSession('2026-06-03', 'ex-mid', 10, 3),
    ]
    const r = evaluateProgression('ex-mid', 'Test', sessions, null)
    expect(r).toBeNull()
  })

  it('requires 3 sessions in conservative mode (3 dismissals)', () => {
    const sessions = [
      makeSession('2026-06-01', 'ex-mid', 10, 2),
      makeSession('2026-06-03', 'ex-mid', 10, 3),
    ]
    const decisions: ProgressionDecision[] = [
      makeDecision('ex-mid', 'dismissed', 1),
      makeDecision('ex-mid', 'dismissed', 2),
      makeDecision('ex-mid', 'dismissed', 3),
    ]
    const r = evaluateProgression('ex-mid', 'Test', sessions, makeFamily(), decisions)
    // Only 2 sessions but conservative mode needs 3
    expect(r).toBeNull()
  })

  it('advances with 3 sessions in conservative mode', () => {
    const sessions = [
      makeSession('2026-06-01', 'ex-mid', 10, 2),
      makeSession('2026-06-03', 'ex-mid', 10, 3),
      makeSession('2026-06-05', 'ex-mid', 10, 2),
    ]
    const decisions: ProgressionDecision[] = [
      makeDecision('ex-mid', 'dismissed', 1),
      makeDecision('ex-mid', 'dismissed', 2),
      makeDecision('ex-mid', 'dismissed', 3),
    ]
    const r = evaluateProgression('ex-mid', 'Test', sessions, makeFamily(), decisions)
    expect(r?.kind).toBe('advance')
  })
})

describe('countConsecutiveDismissals', () => {
  it('returns 0 with no decisions', () => {
    expect(countConsecutiveDismissals([], 'ex-1')).toBe(0)
  })

  it('counts consecutive dismissals', () => {
    const decisions: ProgressionDecision[] = [
      makeDecision('ex-1', 'dismissed', 1),
      makeDecision('ex-1', 'dismissed', 2),
      makeDecision('ex-1', 'dismissed', 3),
    ]
    expect(countConsecutiveDismissals(decisions, 'ex-1')).toBe(3)
  })

  it('resets on acceptance', () => {
    const decisions: ProgressionDecision[] = [
      makeDecision('ex-1', 'dismissed', 1),
      makeDecision('ex-1', 'accepted', 2),
      makeDecision('ex-1', 'dismissed', 3),
      makeDecision('ex-1', 'dismissed', 4),
    ]
    expect(countConsecutiveDismissals(decisions, 'ex-1')).toBe(2)
  })
})
