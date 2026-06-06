import type { MuscleGroup } from '../../../types/workout'
import type { TrainingMuscleGroup, MuscleBucket } from '../../../types/training'

// Maps broad German exercise-catalog muscle groups to anatomical muscles.
export const BROAD_TO_TRAINING: Record<MuscleGroup, TrainingMuscleGroup[]> = {
  brust: ['chest'],
  ruecken: ['back_lats', 'back_upper'],
  schultern: ['shoulders'],
  arme: ['biceps', 'triceps', 'forearms'],
  beine: ['quads', 'hamstrings', 'calves'],
  gesaess: ['glutes'],
  rumpf: ['abs', 'obliques'],
  ganzkoerper: ['chest', 'back_lats', 'shoulders', 'quads', 'hamstrings', 'glutes'],
}

// Shoulders heuristically mapped to push — documented per spec.
export const TRAINING_TO_BUCKET: Record<TrainingMuscleGroup, MuscleBucket> = {
  chest: 'push',
  shoulders: 'push',
  triceps: 'push',
  back_lats: 'pull',
  back_upper: 'pull',
  biceps: 'pull',
  forearms: 'pull',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  abs: 'core',
  obliques: 'core',
  lower_back: 'core',
}

export function broadToTraining(muscle: MuscleGroup): TrainingMuscleGroup[] {
  return BROAD_TO_TRAINING[muscle] ?? []
}

export function trainingToBucket(muscle: TrainingMuscleGroup): MuscleBucket {
  return TRAINING_TO_BUCKET[muscle]
}
