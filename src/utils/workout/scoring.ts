import type { Exercise, PerformedExercise } from '../../types/workout'

type Actual = { sets: number; reps?: number; seconds?: number }

export function exercisePoints(
  ex: Pick<Exercise, 'target' | 'basePoints'>,
  actual: Actual
): { points: number; metTarget: boolean } {
  const sollEinheiten =
    ex.target.type === 'reps'
      ? ex.target.sets * ex.target.reps
      : ex.target.sets * ex.target.seconds

  const istEinheiten =
    ex.target.type === 'reps'
      ? actual.sets * (actual.reps ?? 0)
      : actual.sets * (actual.seconds ?? 0)

  const metTarget = istEinheiten >= sollEinheiten
  if (sollEinheiten <= 0) return { points: ex.basePoints, metTarget }

  const ratio = istEinheiten / sollEinheiten
  const bonusRatio = Math.min(Math.max(ratio - 1, 0), 1.0)
  const points = Math.round(ex.basePoints * (Math.min(ratio, 1) + bonusRatio))
  return { points, metTarget }
}

export function sessionTotals(performed: PerformedExercise[]): {
  totalPoints: number
  bonusPoints: number
} {
  let totalPoints = 0
  let bonusPoints = 0
  for (const p of performed) {
    totalPoints += p.pointsEarned
    bonusPoints += Math.max(0, p.pointsEarned - p.basePointsSnapshot)
  }
  return { totalPoints, bonusPoints }
}

export function sessionTargetPoints(exercises: Pick<Exercise, 'basePoints'>[]): number {
  return exercises.reduce((sum, ex) => sum + ex.basePoints, 0)
}

export function applyBalanceToCover(
  gap: number,
  balance: number
): { used: number; remaining: number } {
  const used = Math.min(Math.max(gap, 0), Math.max(balance, 0))
  return { used, remaining: balance - used }
}
