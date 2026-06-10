import type { WorkoutSession } from '../../types/workout'
import type { LoggedSet, PRResult } from '../../types/training'

interface PrRecord {
  maxReps: number
  maxLevel: number
}

function buildPrRecords(history: WorkoutSession[], exerciseId: string): PrRecord {
  let maxReps = 0
  let maxLevel = 0

  for (const session of history) {
    for (const ls of session.loggedSets ?? []) {
      if (ls.exerciseId !== exerciseId || ls.isWarmup) continue
      const level = ls.variationLevel ?? 0
      if (level > maxLevel) {
        maxLevel = level
        maxReps = ls.reps
      } else if (level === maxLevel && ls.reps > maxReps) {
        maxReps = ls.reps
      }
    }
  }

  return { maxReps, maxLevel }
}

export function detectPR(
  currentSet: LoggedSet,
  history: WorkoutSession[]
): PRResult | null {
  if (currentSet.isWarmup) return null

  const { maxReps, maxLevel } = buildPrRecords(history, currentSet.exerciseId)
  const currentLevel = currentSet.variationLevel ?? 0

  const isPR =
    currentLevel > maxLevel ||
    (currentLevel === maxLevel && currentSet.reps > maxReps) ||
    // First time training this exercise
    (maxLevel === 0 && maxReps === 0)

  if (!isPR) return null

  return {
    exerciseId: currentSet.exerciseId,
    exerciseName: currentSet.exerciseName,
    reps: currentSet.reps,
    variationLevel: currentLevel,
    date: currentSet.timestamp.slice(0, 10),
  }
}

export function getAllPRs(history: WorkoutSession[]): PRResult[] {
  const exerciseIds = new Set<string>()
  for (const s of history) {
    for (const ls of s.loggedSets ?? []) {
      if (!ls.isWarmup) exerciseIds.add(ls.exerciseId)
    }
  }

  const results: PRResult[] = []

  for (const id of exerciseIds) {
    let maxReps = 0
    let maxLevel = 0
    let prDate = ''
    let prName = ''
    let prSession: WorkoutSession | null = null

    const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date))

    for (const session of sortedHistory) {
      for (const ls of session.loggedSets ?? []) {
        if (ls.exerciseId !== id || ls.isWarmup) continue
        const level = ls.variationLevel ?? 0

        if (level > maxLevel) {
          maxLevel = level
          maxReps = ls.reps
          prDate = session.date
          prName = ls.exerciseName
          prSession = session
        } else if (level === maxLevel && ls.reps > maxReps) {
          maxReps = ls.reps
          prDate = session.date
          prName = ls.exerciseName
          prSession = session
        }
      }
    }

    if (prSession && maxReps > 0) {
      results.push({
        exerciseId: id,
        exerciseName: prName,
        reps: maxReps,
        variationLevel: maxLevel,
        date: prDate,
      })
    }
  }

  return results.sort((a, b) => b.date.localeCompare(a.date))
}
