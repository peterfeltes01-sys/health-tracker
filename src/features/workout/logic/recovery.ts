import type { LoggedSet, TrainingMuscleGroup } from '../../../types/training'

export interface RecoveryStatus {
  muscle: TrainingMuscleGroup
  lastTrained: string | null // ISO date string
  hoursSince: number | null
  state: 'fresh' | 'recovering' | 'recently_trained'
}

export function computeRecovery(
  loggedSets: LoggedSet[],
  now: Date,
  hardSetThreshold = 4,
  recoveryHours = 48
): RecoveryStatus[] {
  // Accumulate per-date, per-muscle set counts
  const dateMuscleSets = new Map<string, Map<TrainingMuscleGroup, number>>()

  for (const set of loggedSets) {
    if (set.isWarmup) continue
    const date = set.timestamp.slice(0, 10)

    if (!dateMuscleSets.has(date)) {
      dateMuscleSets.set(date, new Map())
    }
    const muscleMap = dateMuscleSets.get(date)!

    for (const m of set.primaryMusclesSnapshot) {
      muscleMap.set(m, (muscleMap.get(m) ?? 0) + 1)
    }
  }

  // Find the most recent training date and set count per muscle
  const lastTrainedByMuscle = new Map<TrainingMuscleGroup, { date: string; setCount: number }>()

  for (const [date, muscleMap] of dateMuscleSets) {
    for (const [muscle, count] of muscleMap) {
      const existing = lastTrainedByMuscle.get(muscle)
      if (!existing || date > existing.date) {
        lastTrainedByMuscle.set(muscle, { date, setCount: count })
      }
    }
  }

  const nowMs = now.getTime()

  return Array.from(lastTrainedByMuscle.entries()).map(([muscle, { date, setCount }]) => {
    // Approximate mid-day for the training date
    const lastTs = new Date(`${date}T12:00:00`).getTime()
    const hoursSince = (nowMs - lastTs) / 3_600_000

    let state: RecoveryStatus['state']
    if (hoursSince >= recoveryHours) {
      state = 'fresh'
    } else if (setCount >= hardSetThreshold) {
      state = 'recently_trained'
    } else {
      state = 'recovering'
    }

    return { muscle, lastTrained: date, hoursSince, state }
  })
}
