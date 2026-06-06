export type TrainingMuscleGroup =
  | 'chest'
  | 'back_lats'
  | 'back_upper'
  | 'lower_back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'obliques'

export type MuscleBucket = 'push' | 'pull' | 'legs' | 'core'

export type TrainingIntent = 'strength' | 'hypertrophy' | 'endurance' | 'mobility'

export interface MovementFamily {
  id: string
  name: string
  bucket: MuscleBucket
  primaryMuscles: TrainingMuscleGroup[]
  levels: string[] // ordered exerciseIds, easy → hard
}

export interface LoggedSet {
  exerciseId: string
  exerciseName: string
  movementFamilyId: string | null
  variationLevel: number | null
  primaryMusclesSnapshot: TrainingMuscleGroup[]
  secondaryMusclesSnapshot: TrainingMuscleGroup[]
  reps: number
  rir: number | null
  isWarmup: boolean
  restTakenSeconds: number | null
  timestamp: string
}

export const TRAINING_MUSCLE_LABELS: Record<TrainingMuscleGroup, string> = {
  chest: 'Brust',
  back_lats: 'Lat/Rücken',
  back_upper: 'Oberer Rücken',
  lower_back: 'Lendenbereich',
  shoulders: 'Schultern',
  biceps: 'Bizeps',
  triceps: 'Trizeps',
  forearms: 'Unterarme',
  quads: 'Quadrizeps',
  hamstrings: 'Hamstrings',
  glutes: 'Gesäß',
  calves: 'Waden',
  abs: 'Bauch',
  obliques: 'Obliques',
}

export const BUCKET_LABELS: Record<MuscleBucket, string> = {
  push: 'Drücken',
  pull: 'Ziehen',
  legs: 'Beine',
  core: 'Core',
}
