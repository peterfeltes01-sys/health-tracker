import type { WorkoutSession } from '../../types/workout'
import type { LoggedSet } from '../../types/training'

const WEIGHTS = {
  goalAchievement: 0.4,
  rirConsistency: 0.3,
  pauseDiscipline: 0.3,
}

const NEUTRAL = 50
const RIR_TARGET_MIN = 1
const RIR_TARGET_MAX = 3
const REST_TOLERANCE = 0.30 // ±30%

function computeGoalAchievement(session: WorkoutSession): number {
  const workSets = (session.loggedSets ?? []).filter((ls) => !ls.isWarmup)
  if (workSets.length === 0) return NEUTRAL

  let hitCount = 0
  for (const ls of workSets) {
    const performed = session.performed.find((p) => p.exerciseId === ls.exerciseId)
    if (!performed || performed.targetSnapshot.type !== 'reps') {
      hitCount++
      continue
    }
    if (ls.reps >= performed.targetSnapshot.reps) hitCount++
  }

  return Math.round((hitCount / workSets.length) * 100)
}

function computeRirConsistency(sets: LoggedSet[]): number {
  const workSets = sets.filter((ls) => !ls.isWarmup)
  const withRir = workSets.filter((ls) => ls.rir !== null)
  if (withRir.length === 0) return NEUTRAL

  const inTarget = withRir.filter((ls) => ls.rir! >= RIR_TARGET_MIN && ls.rir! <= RIR_TARGET_MAX).length
  return Math.round((inTarget / withRir.length) * 100)
}

function computePauseDiscipline(session: WorkoutSession): number {
  const workSets = (session.loggedSets ?? []).filter((ls) => !ls.isWarmup && ls.restTakenSeconds !== null)
  if (workSets.length === 0) return NEUTRAL

  let disciplineCount = 0
  for (const ls of workSets) {
    const performed = session.performed.find((p) => p.exerciseId === ls.exerciseId)
    if (!performed) {
      disciplineCount++
      continue
    }
    const target = (performed.targetSnapshot as { restSeconds?: number }).restSeconds
    if (target === undefined || target === null || target === 0) {
      disciplineCount++
      continue
    }
    const actual = ls.restTakenSeconds!
    const low = target * (1 - REST_TOLERANCE)
    const high = target * (1 + REST_TOLERANCE)
    if (actual >= low && actual <= high) disciplineCount++
  }

  return Math.round((disciplineCount / workSets.length) * 100)
}

export function computeSessionQuality(session: WorkoutSession): number {
  const sets = session.loggedSets ?? []

  const goalAchievement = computeGoalAchievement(session)
  const rirConsistency = computeRirConsistency(sets)
  const pauseDiscipline = computePauseDiscipline(session)

  const score =
    goalAchievement * WEIGHTS.goalAchievement +
    rirConsistency * WEIGHTS.rirConsistency +
    pauseDiscipline * WEIGHTS.pauseDiscipline

  return Math.max(0, Math.min(100, Math.round(score)))
}
