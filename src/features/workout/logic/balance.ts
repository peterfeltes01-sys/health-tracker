import type { MuscleVolume, BucketVolume } from './volume'
import { TRAINING_MUSCLE_LABELS } from '../../../types/training'

export interface VolumeGuidelines {
  minSetsPerMuscle: number
  maxSetsPerMuscle: number
  pushPullRatioRange: [number, number]
}

const DEFAULT_GUIDELINES: VolumeGuidelines = {
  minSetsPerMuscle: 10,
  maxSetsPerMuscle: 20,
  pushPullRatioRange: [0.7, 1.4],
}

export interface BalanceWarning {
  type: 'push_pull_imbalance' | 'undertrained' | 'overtrained' | 'neglected_bucket'
  message: string
  severity: 'info' | 'warn'
}

export function analyzeBalance(
  byBucket: BucketVolume[],
  byMuscle: MuscleVolume[],
  guidelines: VolumeGuidelines = DEFAULT_GUIDELINES
): BalanceWarning[] {
  const warnings: BalanceWarning[] = []

  const bucketMap = new Map(byBucket.map((b) => [b.bucket, b.sets]))
  const push = bucketMap.get('push') ?? 0
  const pull = bucketMap.get('pull') ?? 0
  const [minRatio, maxRatio] = guidelines.pushPullRatioRange

  if (pull > 0) {
    const ratio = push / pull
    if (ratio < minRatio || ratio > maxRatio) {
      warnings.push({
        type: 'push_pull_imbalance',
        message: `Push/Pull-Verhältnis ${ratio.toFixed(1)} liegt außerhalb des empfohlenen Bereichs (${minRatio}–${maxRatio}).`,
        severity: 'warn',
      })
    }
  }

  for (const { muscle, sets } of byMuscle) {
    const label = TRAINING_MUSCLE_LABELS[muscle]
    if (sets < guidelines.minSetsPerMuscle) {
      warnings.push({
        type: 'undertrained',
        message: `${label}: ${Math.round(sets)} Sätze/Woche — unter dem Richtwert (${guidelines.minSetsPerMuscle}–${guidelines.maxSetsPerMuscle}).`,
        severity: 'info',
      })
    } else if (sets > guidelines.maxSetsPerMuscle) {
      warnings.push({
        type: 'overtrained',
        message: `${label}: ${Math.round(sets)} Sätze/Woche — möglicherweise zu viel (Richtwert ≤ ${guidelines.maxSetsPerMuscle}).`,
        severity: 'warn',
      })
    }
  }

  if (byBucket.length > 0) {
    const maxSets = Math.max(...byBucket.map((b) => b.sets))
    for (const { bucket, sets } of byBucket) {
      if (maxSets > 0 && sets < maxSets * 0.5) {
        warnings.push({
          type: 'neglected_bucket',
          message: `Bereich „${bucket}" wird vernachlässigt (${Math.round(sets)} vs. ${Math.round(maxSets)} Sätze).`,
          severity: 'info',
        })
      }
    }
  }

  return warnings
}
