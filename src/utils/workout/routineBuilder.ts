import { getISODay } from 'date-fns'
import type { Exercise, ExerciseMode, MuscleGroup } from '../../types/workout'
import { EXERCISES } from '../../data/exercises'
import type { CustomExercise } from '../../types/workout'
import { customExerciseToExercise } from './mediaResolver'

const DAY_FOCUS: Record<number, MuscleGroup[]> = {
  1: ['brust', 'schultern', 'rumpf'],
  2: ['beine', 'gesaess'],
  3: ['ruecken', 'arme'],
  4: ['ganzkoerper', 'brust', 'beine'],
  5: ['brust', 'rumpf', 'schultern'],
  6: ['beine', 'ruecken'],
  7: ['arme', 'gesaess', 'rumpf'],
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function buildTodayRoutine(
  mode: ExerciseMode,
  date?: Date,
  customExercises: CustomExercise[] = []
): Exercise[] {
  const today = date ?? new Date()
  const dayOfWeek = getISODay(today)
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const rand = seededRandom(seed)

  const allExercises: Exercise[] = [
    ...EXERCISES,
    ...customExercises.map(customExerciseToExercise),
  ]
  const pool = allExercises.filter((e) => e.modes.includes(mode))
  if (pool.length === 0) return []

  const focusMuscles = DAY_FOCUS[dayOfWeek] ?? DAY_FOCUS[1]

  const primary = pool.filter((e) =>
    e.primaryMuscles.some((m) => focusMuscles.includes(m))
  )
  const secondary = pool.filter((e) =>
    !e.primaryMuscles.some((m) => focusMuscles.includes(m))
  )

  const shuffledPrimary = shuffle(primary, rand)
  const shuffledSecondary = shuffle(secondary, rand)

  const selected: Exercise[] = []
  const usedMuscles = new Set<MuscleGroup>()

  for (const ex of shuffledPrimary) {
    if (selected.length >= 4) break
    selected.push(ex)
    ex.primaryMuscles.forEach((m) => usedMuscles.add(m))
  }

  for (const ex of shuffledSecondary) {
    if (selected.length >= 5) break
    const isNewMuscle = ex.primaryMuscles.some((m) => !usedMuscles.has(m))
    if (isNewMuscle) {
      selected.push(ex)
      ex.primaryMuscles.forEach((m) => usedMuscles.add(m))
    }
  }

  if (selected.length < 4) {
    for (const ex of shuffledSecondary) {
      if (selected.length >= 4) break
      if (!selected.includes(ex)) selected.push(ex)
    }
  }

  return selected.slice(0, 6)
}

export function buildBonusRoutine(
  mode: ExerciseMode,
  doneExerciseIds: string[],
  roundIndex: number = 1,
  customExercises: CustomExercise[] = []
): Exercise[] {
  const today = new Date()
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate() +
    roundIndex * 1000
  const rand = seededRandom(seed)

  const allExercises: Exercise[] = [
    ...EXERCISES,
    ...customExercises.map(customExerciseToExercise),
  ]
  const doneSet = new Set(doneExerciseIds)

  // Prefer exercises not yet done today
  const fresh = allExercises.filter((e) => e.modes.includes(mode) && !doneSet.has(e.id))
  const pool = fresh.length >= 3 ? fresh : allExercises.filter((e) => e.modes.includes(mode))

  return shuffle(pool, rand).slice(0, Math.min(5, pool.length))
}

export function estimateRoutineMinutes(exercises: Exercise[]): number {
  let total = 0
  for (const ex of exercises) {
    const restSeconds = 20
    if (ex.target.type === 'reps') {
      total += ex.target.sets * (ex.target.reps * 3 + restSeconds)
    } else {
      total += ex.target.sets * (ex.target.seconds + restSeconds)
    }
  }
  return Math.round(total / 60)
}
