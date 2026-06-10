import type { WorkoutSession } from '../../types/workout'
import type { ReadinessCheckin, DeloadSuggestion } from '../../types/training'
import { generateId } from '../calculations'

const DELOAD_COOLDOWN_MS = 28 * 24 * 3_600_000 // 4 weeks
const STAGNATION_WEEKS = 2
const MIN_STAGNANT_EXERCISES = 2
const READINESS_TREND_WINDOW_DAYS = 7
const READINESS_TREND_PERIODS = 2

function getWorkWeeks(sessions: WorkoutSession[], now: Date): Map<string, WorkoutSession[]> {
  const map = new Map<string, WorkoutSession[]>()
  for (const s of sessions) {
    const date = new Date(s.date + 'T12:00:00Z')
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
    const weekKey = `week-${Math.floor(diffDays / 7)}`
    const existing = map.get(weekKey) ?? []
    existing.push(s)
    map.set(weekKey, existing)
  }
  return map
}

function hasProgression(sessions: WorkoutSession[], exerciseId: string): boolean {
  const byDate = new Map<string, number>()
  for (const s of sessions) {
    const sets = (s.loggedSets ?? []).filter((ls) => ls.exerciseId === exerciseId && !ls.isWarmup)
    if (sets.length === 0) continue
    const maxReps = Math.max(...sets.map((ls) => ls.reps))
    const maxLevel = Math.max(...sets.map((ls) => ls.variationLevel ?? 0))
    const score = maxLevel * 100 + maxReps
    const existing = byDate.get(s.date)
    if (existing === undefined || score > existing) byDate.set(s.date, score)
  }
  const scores = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0])).map((e) => e[1])
  if (scores.length < 2) return false
  const first = scores[0]
  const last = scores[scores.length - 1]
  return last > first
}

function detectStagnation(history: WorkoutSession[], now: Date): string[] {
  const cutoff = new Date(now.getTime() - STAGNATION_WEEKS * 7 * 86_400_000).toISOString().slice(0, 10)
  const recent = history.filter((s) => s.date >= cutoff && s.loggedSets && s.loggedSets.length > 0)
  if (recent.length < 2) return []

  const exerciseIds = new Set<string>()
  for (const s of recent) {
    for (const ls of s.loggedSets ?? []) {
      if (!ls.isWarmup) exerciseIds.add(ls.exerciseId)
    }
  }

  const stagnant: string[] = []
  for (const id of exerciseIds) {
    if (!hasProgression(recent, id)) stagnant.push(id)
  }
  return stagnant
}

function rollingAvgReadiness(checkins: ReadinessCheckin[], fromDate: string, toDate: string): number | null {
  const inRange = checkins.filter((c) => c.date >= fromDate && c.date <= toDate)
  if (inRange.length === 0) return null
  return inRange.reduce((s, c) => s + c.score, 0) / inRange.length
}

function detectReadinessTrend(readinessHistory: ReadinessCheckin[], now: Date): boolean {
  const windows: Array<{ from: string; to: string }> = []
  for (let i = 0; i < READINESS_TREND_PERIODS; i++) {
    const toMs = now.getTime() - i * READINESS_TREND_WINDOW_DAYS * 86_400_000
    const fromMs = toMs - READINESS_TREND_WINDOW_DAYS * 86_400_000
    windows.push({
      from: new Date(fromMs).toISOString().slice(0, 10),
      to: new Date(toMs).toISOString().slice(0, 10),
    })
  }
  const avgs = windows.map((w) => rollingAvgReadiness(readinessHistory, w.from, w.to))
  if (avgs.some((a) => a === null)) return false
  // Trend is negative if the oldest window average > the most recent
  return (avgs[READINESS_TREND_PERIODS - 1] as number) > (avgs[0] as number) + 5
}

export function detectDeload(
  history: WorkoutSession[],
  readinessHistory: ReadinessCheckin[],
  lastDeloadSuggestedAt?: number,
  now: Date = new Date()
): DeloadSuggestion | null {
  if (lastDeloadSuggestedAt !== undefined) {
    if (now.getTime() - lastDeloadSuggestedAt < DELOAD_COOLDOWN_MS) return null
  }

  const weeks = getWorkWeeks(history, now)
  const recentWeeks = Array.from(weeks.values()).filter((_, i) => i < STAGNATION_WEEKS)
  const hasRecentSessions = recentWeeks.some((w) => w.length > 0)
  if (!hasRecentSessions) return null

  const stagnantExercises = detectStagnation(history, now)
  if (stagnantExercises.length >= MIN_STAGNANT_EXERCISES) {
    return {
      id: generateId(),
      trigger: 'stagnation',
      reason: `Bei ${stagnantExercises.length} Übungen zeigt sich seit ${STAGNATION_WEEKS} Wochen keine Progression. Eine Deload-Woche gibt deinem Körper Zeit zur Superkompensation.`,
      suggestedAt: now.getTime(),
    }
  }

  const readinessTrendDown = detectReadinessTrend(readinessHistory, now)
  if (readinessTrendDown) {
    return {
      id: generateId(),
      trigger: 'readiness_trend',
      reason: 'Dein Readiness-Score zeigt seit 2 Wochen einen negativen Trend. Eine Deload-Woche hilft dir, erholt und motiviert zurückzukehren.',
      suggestedAt: now.getTime(),
    }
  }

  return null
}
