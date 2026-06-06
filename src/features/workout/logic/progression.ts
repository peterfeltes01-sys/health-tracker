import type { Exercise } from '../../../types/workout'
import type { MovementFamily } from '../../../types/training'

export interface ProgressionConfig {
  qualifyingSessions: number // default 2
}

export interface SessionSetsForExercise {
  sessionDate: string
  sets: { reps: number; rir: number | null }[]
}

export type ProgressionSuggestion =
  | { kind: 'advance'; toExerciseId: string; reason: string }
  | { kind: 'regress'; toExerciseId: string; reason: string }
  | { kind: 'hold'; nextTargetReps: number; reason: string }

/**
 * Double-progression + variation switch.
 * ADVANCE: last `qualifyingSessions` sessions all hit repRange.max in all targetSets,
 *          OR RIR >= 3 across all sets (exercise too easy).
 * REGRESS: last `qualifyingSessions` sessions majority of sets missed repRange.min.
 * HOLD: otherwise — suggest nextTargetReps = best last reps + 1 (capped at max).
 * Pure function, no I/O.
 */
export function evaluateProgression(
  exercise: Exercise,
  family: MovementFamily | null,
  recent: SessionSetsForExercise[],
  config: ProgressionConfig = { qualifyingSessions: 2 }
): ProgressionSuggestion {
  const { qualifyingSessions } = config
  const repRange = exercise.defaultRepRange ?? { min: 8, max: 15 }
  const targetSets = exercise.defaultTargetSets ?? 3

  if (recent.length === 0) {
    return {
      kind: 'hold',
      nextTargetReps: repRange.min,
      reason: 'Noch keine Trainingsdaten — starte mit dem Mindestziel.',
    }
  }

  const sessions = recent.slice(-qualifyingSessions)
  const enoughData = sessions.length >= qualifyingSessions

  const sessionQualifiesAdvance = (s: SessionSetsForExercise): boolean => {
    const workSets = s.sets.slice(0, targetSets)
    if (workSets.length < targetSets) return false
    const allHighRir = workSets.every((x) => x.rir !== null && x.rir >= 3)
    if (allHighRir) return true
    return workSets.every((x) => x.reps >= repRange.max)
  }

  const sessionQualifiesRegress = (s: SessionSetsForExercise): boolean => {
    const workSets = s.sets.slice(0, targetSets)
    if (workSets.length === 0) return false
    const belowMin = workSets.filter((x) => x.reps < repRange.min).length
    return belowMin > workSets.length / 2
  }

  const canAdvance = enoughData && sessions.every(sessionQualifiesAdvance)
  const shouldRegress = enoughData && sessions.every(sessionQualifiesRegress)

  if (canAdvance) {
    if (family !== null) {
      const idx = family.levels.indexOf(exercise.id)
      const nextIdx = idx + 1
      if (idx >= 0 && nextIdx < family.levels.length) {
        return {
          kind: 'advance',
          toExerciseId: family.levels[nextIdx],
          reason: `Seit ${qualifyingSessions} Sessions erreichst du ${repRange.max} Wdh. oder trainierst mit sehr niedrigem Effort (RIR ≥ 3). Zeit für die nächste Stufe!`,
        }
      }
    }
    // No family or already at top
    return {
      kind: 'hold',
      nextTargetReps: repRange.max,
      reason: 'Ziel erreicht! Keine schwerere Variation verfügbar — halte das Niveau.',
    }
  }

  if (shouldRegress && family !== null) {
    const idx = family.levels.indexOf(exercise.id)
    if (idx > 0) {
      return {
        kind: 'regress',
        toExerciseId: family.levels[idx - 1],
        reason: `Seit ${qualifyingSessions} Sessions wird ${repRange.min} Wdh. in der Mehrzahl der Sätze nicht erreicht. Eine leichtere Variation hilft dir, sauber zu trainieren.`,
      }
    }
  }

  // Hold: aim for +1 rep on top of best recent set
  const lastSession = sessions[sessions.length - 1]
  const lastBest =
    lastSession.sets.length > 0
      ? Math.max(...lastSession.sets.map((x) => x.reps))
      : repRange.min
  const nextTargetReps = Math.min(lastBest + 1, repRange.max)

  return {
    kind: 'hold',
    nextTargetReps,
    reason: `Steigere dich auf ${nextTargetReps} Wdh. — dann folgt der nächste Schritt.`,
  }
}
