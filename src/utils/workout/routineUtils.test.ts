import { describe, it, expect } from 'vitest'
import { getDueRoutines, reorderExercises, shuffleExercises } from './routineUtils'
import type { Routine, RoutineExercise } from '../../types/routine'

function makeRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'r1',
    name: 'Test',
    exercises: [],
    schedule: { type: 'daily' },
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

function makeExercise(exerciseId: string, order: number): RoutineExercise {
  return { exerciseId, order, target: { mode: 'reps', sets: 3, reps: 10 } }
}

describe('getDueRoutines', () => {
  it('returns active daily routines', () => {
    const routines = [
      makeRoutine({ id: 'r1', isActive: true }),
      makeRoutine({ id: 'r2', isActive: false }),
    ]
    const due = getDueRoutines(routines, new Date())
    expect(due).toHaveLength(1)
    expect(due[0].id).toBe('r1')
  })

  it('returns empty array when no routines', () => {
    expect(getDueRoutines([], new Date())).toEqual([])
  })

  it('returns all active routines for daily schedule', () => {
    const routines = [
      makeRoutine({ id: 'r1', isActive: true }),
      makeRoutine({ id: 'r2', isActive: true }),
    ]
    expect(getDueRoutines(routines, new Date())).toHaveLength(2)
  })
})

describe('reorderExercises', () => {
  it('moves an item forward', () => {
    const exercises = [makeExercise('a', 0), makeExercise('b', 1), makeExercise('c', 2)]
    const result = reorderExercises(exercises, 0, 2)
    expect(result.map((e) => e.exerciseId)).toEqual(['b', 'c', 'a'])
    expect(result.map((e) => e.order)).toEqual([0, 1, 2])
  })

  it('moves an item backward', () => {
    const exercises = [makeExercise('a', 0), makeExercise('b', 1), makeExercise('c', 2)]
    const result = reorderExercises(exercises, 2, 0)
    expect(result.map((e) => e.exerciseId)).toEqual(['c', 'a', 'b'])
    expect(result.map((e) => e.order)).toEqual([0, 1, 2])
  })

  it('is immutable — does not modify original array', () => {
    const original = [makeExercise('a', 0), makeExercise('b', 1)]
    const result = reorderExercises(original, 0, 1)
    expect(original[0].exerciseId).toBe('a')
    expect(result[0].exerciseId).toBe('b')
  })

  it('renumbers order values consecutively', () => {
    const exercises = [makeExercise('x', 5), makeExercise('y', 10), makeExercise('z', 15)]
    const result = reorderExercises(exercises, 1, 0)
    expect(result.map((e) => e.order)).toEqual([0, 1, 2])
  })
})

describe('shuffleExercises', () => {
  it('returns same number of elements', () => {
    const exercises = [makeExercise('a', 0), makeExercise('b', 1), makeExercise('c', 2)]
    const result = shuffleExercises(exercises)
    expect(result).toHaveLength(3)
  })

  it('contains the same exercise IDs', () => {
    const exercises = [makeExercise('a', 0), makeExercise('b', 1), makeExercise('c', 2)]
    const result = shuffleExercises(exercises)
    expect(result.map((e) => e.exerciseId).sort()).toEqual(['a', 'b', 'c'])
  })

  it('renumbers order values from 0', () => {
    const exercises = [makeExercise('a', 0), makeExercise('b', 1), makeExercise('c', 2)]
    const result = shuffleExercises(exercises)
    expect(result.map((e) => e.order)).toEqual([0, 1, 2])
  })

  it('does not mutate the input array', () => {
    const exercises = [makeExercise('a', 0), makeExercise('b', 1)]
    const first = exercises[0]
    shuffleExercises(exercises)
    expect(exercises[0]).toBe(first)
  })
})
