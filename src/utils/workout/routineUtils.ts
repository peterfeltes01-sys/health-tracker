import type { Routine, RoutineExercise, ExerciseTarget } from '../../types/routine'
import type { Exercise } from '../../types/workout'
import { EXERCISES } from '../../data/exercises'

export function getDueRoutines(routines: Routine[], _date: Date): Routine[] {
  return routines.filter((r) => r.isActive && r.schedule.type === 'daily')
}

export function reorderExercises(
  exercises: RoutineExercise[],
  fromIndex: number,
  toIndex: number
): RoutineExercise[] {
  const result = [...exercises]
  const [moved] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, moved)
  return result.map((e, i) => ({ ...e, order: i }))
}

export function shuffleExercises(exercises: RoutineExercise[]): RoutineExercise[] {
  const result = [...exercises]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result.map((e, i) => ({ ...e, order: i }))
}

export function targetToExerciseTarget(t: ExerciseTarget): Exercise['target'] {
  if (t.mode === 'reps') {
    return { type: 'reps', sets: t.sets ?? 3, reps: t.reps ?? 10 }
  }
  return { type: 'duration', sets: t.sets ?? 1, seconds: t.durationSec ?? 30 }
}

export function buildExercisesFromRoutine(
  routine: Routine,
  catalogExtras: Exercise[] = []
): Exercise[] {
  const all = [...EXERCISES, ...catalogExtras]
  const byId = new Map(all.map((e) => [e.id, e]))
  return routine.exercises
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((re) => {
      const base = byId.get(re.exerciseId)
      if (!base) return []
      return [{ ...base, target: targetToExerciseTarget(re.target) }]
    })
}

export function defaultTargetFromExercise(exercise: Exercise): ExerciseTarget {
  if (exercise.target.type === 'reps') {
    return { mode: 'reps', sets: exercise.target.sets, reps: exercise.target.reps }
  }
  return { mode: 'duration', sets: exercise.target.sets, durationSec: exercise.target.seconds }
}
