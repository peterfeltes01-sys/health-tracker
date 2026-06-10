import type { WorkoutSession } from '../../types/workout'
import type { MovementFamily, TrainingMuscleGroup, StrengthProfile, ExerciseStrengthEntry, MuscleRadarEntry } from '../../types/training'

const FOUR_WEEKS_MS = 28 * 24 * 3_600_000

interface ExerciseHistory {
  exerciseId: string
  exerciseName: string
  sessions: Array<{ date: string; maxReps: number; level: number }>
}

function buildExerciseHistories(history: WorkoutSession[]): ExerciseHistory[] {
  const map = new Map<string, ExerciseHistory>()

  for (const session of history) {
    for (const ls of session.loggedSets ?? []) {
      if (ls.isWarmup) continue
      const existing = map.get(ls.exerciseId)
      const level = ls.variationLevel ?? 0
      if (!existing) {
        map.set(ls.exerciseId, {
          exerciseId: ls.exerciseId,
          exerciseName: ls.exerciseName,
          sessions: [{ date: session.date, maxReps: ls.reps, level }],
        })
      } else {
        const sessionEntry = existing.sessions.find((s) => s.date === session.date)
        if (sessionEntry) {
          if (level > sessionEntry.level || (level === sessionEntry.level && ls.reps > sessionEntry.maxReps)) {
            sessionEntry.level = level
            sessionEntry.maxReps = ls.reps
          }
        } else {
          existing.sessions.push({ date: session.date, maxReps: ls.reps, level })
        }
      }
    }
  }

  for (const h of map.values()) {
    h.sessions.sort((a, b) => a.date.localeCompare(b.date))
  }

  return Array.from(map.values())
}

function computeTrend(sessions: ExerciseHistory['sessions'], now: Date): ExerciseStrengthEntry['trend'] {
  const cutoff = new Date(now.getTime() - FOUR_WEEKS_MS).toISOString().slice(0, 10)
  const recent = sessions.filter((s) => s.date >= cutoff)
  if (recent.length < 2) return 'flat'

  const first = recent[0]
  const last = recent[recent.length - 1]
  const levelDelta = last.level - first.level
  const repDelta = last.maxReps - first.maxReps

  if (levelDelta > 0 || (levelDelta === 0 && repDelta > 1)) return 'up'
  if (levelDelta < 0 || (levelDelta === 0 && repDelta < -1)) return 'down'
  return 'flat'
}

function buildRadarData(
  histories: ExerciseHistory[],
  families: MovementFamily[],
  now: Date
): MuscleRadarEntry[] {
  const muscleScores = new Map<TrainingMuscleGroup, number[]>()

  for (const h of histories) {
    const family = families.find((f) => f.levels.includes(h.exerciseId))
    if (!family) continue

    const lastSession = h.sessions[h.sessions.length - 1]
    if (!lastSession) continue

    const recentCutoff = new Date(now.getTime() - FOUR_WEEKS_MS).toISOString().slice(0, 10)
    const trainedRecently = h.sessions.some((s) => s.date >= recentCutoff)
    const frequencyWeight = trainedRecently ? 1.0 : 0.5

    const maxLevelInFamily = family.levels.length
    const normalizedLevel = maxLevelInFamily > 1
      ? (lastSession.level / maxLevelInFamily) * 100
      : 50

    const score = normalizedLevel * frequencyWeight

    for (const muscle of family.primaryMuscles) {
      const existing = muscleScores.get(muscle) ?? []
      existing.push(score)
      muscleScores.set(muscle, existing)
    }
  }

  return Array.from(muscleScores.entries()).map(([muscle, scores]) => ({
    muscle,
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }))
}

export function computeStrengthProfile(
  history: WorkoutSession[],
  families: MovementFamily[],
  now: Date = new Date()
): StrengthProfile {
  const exerciseHistories = buildExerciseHistories(history)

  const exercises: ExerciseStrengthEntry[] = exerciseHistories.map((h) => {
    const last = h.sessions[h.sessions.length - 1]
    const recentSessions = h.sessions.slice(-6)
    return {
      exerciseId: h.exerciseId,
      exerciseName: h.exerciseName,
      currentLevel: last?.level ?? 0,
      trend: computeTrend(h.sessions, now),
      recentReps: recentSessions.map((s) => s.maxReps),
    }
  })

  const radarData = buildRadarData(exerciseHistories, families, now)

  return { exercises, radarData }
}
