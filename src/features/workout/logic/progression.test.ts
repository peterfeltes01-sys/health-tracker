import { describe, it, expect } from 'vitest'
import { evaluateProgression } from './progression'
import type { Exercise } from '../../../types/workout'
import type { MovementFamily } from '../../../types/training'

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    name: 'Test Exercise',
    modes: ['bodyweight'],
    primaryMuscles: ['brust'],
    secondaryMuscles: [],
    difficulty: 'mittel',
    target: { type: 'reps', sets: 3, reps: 10 },
    basePoints: 10,
    mediaUrls: [],
    instructions: [],
    defaultRepRange: { min: 8, max: 12 },
    defaultTargetSets: 3,
    movementFamilyId: 'fam-1',
    difficultyLevel: 2,
    ...overrides,
  }
}

function makeFamily(): MovementFamily {
  return {
    id: 'fam-1',
    name: 'Push Family',
    bucket: 'push',
    primaryMuscles: ['chest'],
    levels: ['ex-0', 'ex-1', 'ex-2'],
  }
}

function makeSessions(
  count: number,
  repsPerSet: number,
  rir: number | null = null
) {
  return Array.from({ length: count }, (_, i) => ({
    sessionDate: `2026-06-0${i + 1}`,
    sets: Array.from({ length: 3 }, () => ({ reps: repsPerSet, rir })),
  }))
}

describe('evaluateProgression', () => {
  describe('hold', () => {
    it('returns hold with min reps when no history', () => {
      const ex = makeExercise()
      const result = evaluateProgression(ex, makeFamily(), [])
      expect(result.kind).toBe('hold')
      if (result.kind === 'hold') expect(result.nextTargetReps).toBe(8)
    })

    it('returns hold when only 1 qualifying session (< threshold)', () => {
      const ex = makeExercise()
      const sessions = makeSessions(1, 12) // max reps but only 1 session
      const result = evaluateProgression(ex, makeFamily(), sessions)
      expect(result.kind).toBe('hold')
    })

    it('holds and increments reps when below max', () => {
      const ex = makeExercise()
      const sessions = makeSessions(2, 10)
      const result = evaluateProgression(ex, makeFamily(), sessions)
      expect(result.kind).toBe('hold')
      if (result.kind === 'hold') expect(result.nextTargetReps).toBe(11)
    })

    it('caps nextTargetReps at max', () => {
      const ex = makeExercise()
      // 1 session of max reps (not enough to advance, needs 2)
      const sessions = makeSessions(1, 12)
      const result = evaluateProgression(ex, makeFamily(), sessions, { qualifyingSessions: 2 })
      expect(result.kind).toBe('hold')
      if (result.kind === 'hold') expect(result.nextTargetReps).toBeLessThanOrEqual(12)
    })

    it('holds at top of family when no next level', () => {
      const ex = makeExercise({ id: 'ex-2', difficultyLevel: 3 })
      const sessions = makeSessions(2, 12)
      const result = evaluateProgression(ex, makeFamily(), sessions)
      expect(result.kind).toBe('hold')
    })
  })

  describe('advance', () => {
    it('advances when max reps hit in all qualifying sessions', () => {
      const ex = makeExercise()
      const sessions = makeSessions(2, 12)
      const result = evaluateProgression(ex, makeFamily(), sessions)
      expect(result.kind).toBe('advance')
      if (result.kind === 'advance') expect(result.toExerciseId).toBe('ex-2')
    })

    it('advances with high RIR signal (RIR >= 3)', () => {
      const ex = makeExercise()
      // Only 8 reps but RIR 3 → too easy
      const sessions = makeSessions(2, 8, 3)
      const result = evaluateProgression(ex, makeFamily(), sessions)
      expect(result.kind).toBe('advance')
    })

    it('does not advance without a family', () => {
      const ex = makeExercise({ movementFamilyId: null })
      const sessions = makeSessions(2, 12)
      const result = evaluateProgression(ex, null, sessions)
      expect(result.kind).toBe('hold')
    })
  })

  describe('regress', () => {
    it('regresses when min reps missed in majority of sets across qualifying sessions', () => {
      const ex = makeExercise()
      const sessions = makeSessions(2, 4) // well below min of 8
      const result = evaluateProgression(ex, makeFamily(), sessions)
      expect(result.kind).toBe('regress')
      if (result.kind === 'regress') expect(result.toExerciseId).toBe('ex-0')
    })

    it('does not regress when already at first level', () => {
      const ex = makeExercise({ id: 'ex-0', difficultyLevel: 1 })
      const sessions = makeSessions(2, 4)
      const result = evaluateProgression(ex, makeFamily(), sessions)
      // ex-0 has no previous level → hold
      expect(result.kind).toBe('hold')
    })

    it('does not regress without a family', () => {
      const ex = makeExercise({ movementFamilyId: null })
      const sessions = makeSessions(2, 4)
      const result = evaluateProgression(ex, null, sessions)
      expect(result.kind).toBe('hold')
    })
  })
})
