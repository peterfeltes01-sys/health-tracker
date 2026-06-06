import type { TrainingIntent } from '../../../types/training'

export function getDefaultRestSeconds(intent: TrainingIntent): number | null {
  switch (intent) {
    case 'strength':    return 150 // 2.5 min
    case 'hypertrophy': return 90
    case 'endurance':   return 40
    case 'mobility':    return null
  }
}
