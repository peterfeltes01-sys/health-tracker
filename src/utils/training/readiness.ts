import type { WorkoutSession } from '../../types/workout'
import type { BloodPressureEntry, WeightEntry } from '../../types'
import type { ReadinessBand } from '../../types/training'

export interface ReadinessInput {
  checkin?: { sleep?: number; energy?: number; soreness?: number }
  recentSessions: WorkoutSession[]
  bpEntries: BloodPressureEntry[]
  weightEntries: WeightEntry[]
  now?: Date
}

export interface ReadinessFactors {
  subjective?: number
  frequency: number
  recovery: number
  bpTrend?: number
  weightTrend?: number
}

export interface ReadinessResult {
  score: number
  band: ReadinessBand
  factors: ReadinessFactors
}

export const READINESS_WEIGHTS = {
  subjective: 0.35,
  frequency: 0.20,
  recovery: 0.25,
  bpTrend: 0.10,
  weightTrend: 0.10,
} as const

const NEUTRAL_SCORE = 75

function bandForScore(score: number): ReadinessBand {
  if (score >= 70) return 'FULL'
  if (score >= 40) return 'REDUCED'
  return 'RECOVERY'
}

function computeSubjectiveScore(checkin: { sleep?: number; energy?: number; soreness?: number }): number {
  const parts: number[] = []
  if (checkin.sleep !== undefined) parts.push(((checkin.sleep - 1) / 4) * 100)
  if (checkin.energy !== undefined) parts.push(((checkin.energy - 1) / 4) * 100)
  // soreness is inverted: 1 (none) → 100, 5 (severe) → 0
  if (checkin.soreness !== undefined) parts.push(((5 - checkin.soreness) / 4) * 100)
  if (parts.length === 0) return NEUTRAL_SCORE
  return parts.reduce((a, b) => a + b, 0) / parts.length
}

function computeFrequencyScore(sessions: WorkoutSession[]): number {
  const count = sessions.length
  if (count === 0) return 100
  if (count === 1) return 95
  if (count === 2) return 85
  if (count === 3) return 75
  if (count === 4) return 65
  if (count === 5) return 55
  if (count === 6) return 35
  return 15
}

function computeRecoveryScore(sessions: WorkoutSession[], now: Date): number {
  if (sessions.length === 0) return 100
  const sorted = [...sessions].sort((a, b) => b.completedAt - a.completedAt)
  const lastCompletedAt = sorted[0].completedAt
  const hoursAgo = (now.getTime() - lastCompletedAt) / 3_600_000
  if (hoursAgo < 8) return 20
  if (hoursAgo < 16) return 50
  if (hoursAgo < 24) return 70
  if (hoursAgo < 36) return 90
  return 100
}

function computeBpTrendScore(entries: BloodPressureEntry[]): number | undefined {
  if (entries.length < 3) return undefined
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const half = Math.floor(sorted.length / 2)
  const early = sorted.slice(0, half)
  const late = sorted.slice(-half)
  const avg = (arr: BloodPressureEntry[]) =>
    arr.reduce((s, e) => s + e.systolic, 0) / arr.length
  const delta = avg(late) - avg(early)
  if (delta > 8) return 40
  if (delta > 4) return 70
  return 100
}

function computeWeightTrendScore(entries: WeightEntry[], now: Date): number | undefined {
  const cutoff14 = new Date(now.getTime() - 14 * 86_400_000).toISOString().slice(0, 10)
  const cutoff7 = new Date(now.getTime() - 7 * 86_400_000).toISOString().slice(0, 10)
  const recent = entries.filter((e) => e.date >= cutoff7)
  const earlier = entries.filter((e) => e.date >= cutoff14 && e.date < cutoff7)
  if (recent.length < 2 || earlier.length < 2) return undefined
  const avgRecent = recent.reduce((s, e) => s + e.weightKg, 0) / recent.length
  const avgEarlier = earlier.reduce((s, e) => s + e.weightKg, 0) / earlier.length
  const drop = avgEarlier - avgRecent
  if (drop > 1.5) return 60
  return 100
}

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const now = input.now ?? new Date()

  const frequency = computeFrequencyScore(input.recentSessions)
  const recovery = computeRecoveryScore(input.recentSessions, now)
  const bpTrend = computeBpTrendScore(input.bpEntries)
  const weightTrend = computeWeightTrendScore(input.weightEntries, now)

  let subjective: number | undefined
  if (input.checkin) {
    const val = computeSubjectiveScore(input.checkin)
    if (
      input.checkin.sleep !== undefined ||
      input.checkin.energy !== undefined ||
      input.checkin.soreness !== undefined
    ) {
      subjective = val
    }
  }

  // Build weighted average; missing factors use NEUTRAL_SCORE
  const weights = READINESS_WEIGHTS
  const subjectiveVal = subjective ?? NEUTRAL_SCORE
  const bpVal = bpTrend ?? NEUTRAL_SCORE
  const weightVal = weightTrend ?? NEUTRAL_SCORE

  const score = Math.round(
    subjectiveVal * weights.subjective +
      frequency * weights.frequency +
      recovery * weights.recovery +
      bpVal * weights.bpTrend +
      weightVal * weights.weightTrend
  )

  const clampedScore = Math.max(0, Math.min(100, score))

  return {
    score: clampedScore,
    band: bandForScore(clampedScore),
    factors: {
      subjective,
      frequency,
      recovery,
      bpTrend,
      weightTrend,
    },
  }
}
