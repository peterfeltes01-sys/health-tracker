import type { WorkoutSession } from '../../types/workout'
import type { MovementFamily } from '../../types/training'
import type { TrainingProgressionSuggestion, ProgressionDecision } from '../../types/training'
import { generateId } from '../calculations'

export interface ProgressionConfig {
  qualifyingSessions: number
  minAvgRirForAdvance: number
}

const DEFAULT_CONFIG: ProgressionConfig = {
  qualifyingSessions: 2,
  minAvgRirForAdvance: 2,
}

const CONSERVATIVE_CONFIG: ProgressionConfig = {
  qualifyingSessions: 3,
  minAvgRirForAdvance: 2,
}

interface SetRecord {
  reps: number
  rir: number | null
}

interface SessionRecord {
  date: string
  sets: SetRecord[]
  targetReps: number
  targetSets: number
}

function extractSessionRecords(
  history: WorkoutSession[],
  exerciseId: string
): SessionRecord[] {
  const map = new Map<string, SessionRecord>()

  for (const session of history) {
    for (const ls of session.loggedSets ?? []) {
      if (ls.exerciseId !== exerciseId || ls.isWarmup) continue
      const existing = map.get(session.date)
      if (existing) {
        existing.sets.push({ reps: ls.reps, rir: ls.rir })
      } else {
        const performed = session.performed.find((p) => p.exerciseId === exerciseId)
        const targetReps =
          performed?.targetSnapshot.type === 'reps'
            ? performed.targetSnapshot.reps
            : 10
        const targetSets =
          performed?.targetSnapshot.type === 'reps' || performed?.targetSnapshot.type === 'duration'
            ? performed.targetSnapshot.sets
            : 3
        map.set(session.date, {
          date: session.date,
          sets: [{ reps: ls.reps, rir: ls.rir }],
          targetReps,
          targetSets,
        })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
}

function avgRir(sets: SetRecord[]): number | null {
  const withRir = sets.filter((s) => s.rir !== null)
  if (withRir.length === 0) return null
  return withRir.reduce((sum, s) => sum + s.rir!, 0) / withRir.length
}

function sessionQualifiesAdvance(rec: SessionRecord, cfg: ProgressionConfig): boolean {
  const workSets = rec.sets.slice(0, rec.targetSets)
  if (workSets.length < rec.targetSets) return false
  const avg = avgRir(workSets)
  if (avg !== null && avg >= cfg.minAvgRirForAdvance) {
    return workSets.every((s) => s.reps >= rec.targetReps)
  }
  // No RIR data: require target reps hit
  return workSets.every((s) => s.reps >= rec.targetReps)
}

function sessionQualifiesRegress(rec: SessionRecord): boolean {
  const workSets = rec.sets.slice(0, rec.targetSets)
  if (workSets.length === 0) return false
  const failCount = workSets.filter((s) => s.reps < Math.max(1, rec.targetReps - 2)).length
  const hasZeroRir = workSets.every((s) => s.rir === 0)
  return failCount > workSets.length / 2 || hasZeroRir
}

function countConsecutiveDismissals(
  decisions: ProgressionDecision[],
  exerciseId: string
): number {
  const forExercise = [...decisions]
    .filter((d) => d.exerciseId === exerciseId)
    .sort((a, b) => b.timestamp - a.timestamp)
  let count = 0
  for (const d of forExercise) {
    if (d.action === 'dismissed') count++
    else break
  }
  return count
}

export function evaluateProgression(
  exerciseId: string,
  exerciseName: string,
  history: WorkoutSession[],
  family: MovementFamily | null,
  decisions: ProgressionDecision[] = [],
  now: Date = new Date()
): TrainingProgressionSuggestion | null {
  const records = extractSessionRecords(history, exerciseId)
  if (records.length === 0) return null

  const consecutiveDismissals = countConsecutiveDismissals(decisions, exerciseId)
  const cfg =
    consecutiveDismissals >= 3 ? CONSERVATIVE_CONFIG : DEFAULT_CONFIG

  const recent = records.slice(-cfg.qualifyingSessions)
  if (recent.length < cfg.qualifyingSessions) return null

  const currentLevel = family ? family.levels.indexOf(exerciseId) : -1

  const canAdvance = recent.every((r) => sessionQualifiesAdvance(r, cfg))
  const shouldRegress = recent.every((r) => sessionQualifiesRegress(r))

  if (canAdvance && family !== null && currentLevel >= 0) {
    const nextIdx = currentLevel + 1
    if (nextIdx < family.levels.length) {
      const toExerciseId = family.levels[nextIdx]
      const rirNote = recent.every((r) => avgRir(r.sets) !== null)
        ? ` mit durchschnittlich RIR ≥ ${cfg.minAvgRirForAdvance}`
        : ''
      return {
        id: generateId(),
        exerciseId,
        exerciseName,
        kind: 'advance',
        fromLevel: currentLevel + 1,
        toLevel: nextIdx + 1,
        toExerciseId,
        reason: `Ziel-Reps ${cfg.qualifyingSessions}× erreicht${rirNote} — bereit für die nächste Variante.`,
        suggestedAt: now.getTime(),
      }
    }
  }

  if (shouldRegress && family !== null && currentLevel > 0) {
    const toIdx = currentLevel - 1
    return {
      id: generateId(),
      exerciseId,
      exerciseName,
      kind: 'regress',
      fromLevel: currentLevel + 1,
      toLevel: toIdx + 1,
      toExerciseId: family.levels[toIdx],
      reason: `Ziel-Reps wurden ${cfg.qualifyingSessions}× deutlich verfehlt — eine leichtere Variante schützt deine Technik.`,
      suggestedAt: now.getTime(),
    }
  }

  return null
}

export { countConsecutiveDismissals }
