import type { LoggedSet, TrainingMuscleGroup, MuscleBucket } from '../../../types/training'
import { trainingToBucket } from './muscleMapping'

export interface MuscleVolume {
  muscle: TrainingMuscleGroup
  sets: number // weighted (primary = 1.0, secondary = secondaryWeight)
}

export interface BucketVolume {
  bucket: MuscleBucket
  sets: number
}

export function computeWeeklyVolume(
  loggedSets: LoggedSet[],
  windowStart: Date,
  windowEnd: Date,
  secondaryWeight = 0.5
): { byMuscle: MuscleVolume[]; byBucket: BucketVolume[] } {
  const startTs = windowStart.getTime()
  const endTs = windowEnd.getTime()

  const muscleMap = new Map<TrainingMuscleGroup, number>()
  const bucketMap = new Map<MuscleBucket, number>()

  const addMuscle = (m: TrainingMuscleGroup, weight: number) => {
    muscleMap.set(m, (muscleMap.get(m) ?? 0) + weight)
    const bucket = trainingToBucket(m)
    bucketMap.set(bucket, (bucketMap.get(bucket) ?? 0) + weight)
  }

  for (const set of loggedSets) {
    if (set.isWarmup) continue
    const ts = new Date(set.timestamp).getTime()
    if (ts < startTs || ts > endTs) continue

    for (const m of set.primaryMusclesSnapshot) {
      addMuscle(m, 1.0)
    }
    for (const m of set.secondaryMusclesSnapshot) {
      addMuscle(m, secondaryWeight)
    }
  }

  const byMuscle: MuscleVolume[] = Array.from(muscleMap.entries())
    .map(([muscle, sets]) => ({ muscle, sets }))
    .sort((a, b) => b.sets - a.sets)

  const byBucket: BucketVolume[] = Array.from(bucketMap.entries())
    .map(([bucket, sets]) => ({ bucket, sets }))
    .sort((a, b) => b.sets - a.sets)

  return { byMuscle, byBucket }
}
