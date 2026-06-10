// ── Readiness ──────────────────────────────────────────────────────────────

export type ReadinessBand = 'FULL' | 'REDUCED' | 'RECOVERY'

export interface ReadinessCheckin {
  id: string
  userId: string
  date: string
  sleep?: number
  energy?: number
  soreness?: number
  score: number
  band: ReadinessBand
  factors: {
    subjective?: number
    frequency: number
    recovery: number
    bpTrend?: number
    weightTrend?: number
  }
  createdAt: number
}

// ── Progression decisions ─────────────────────────────────────────────────

export interface ProgressionDecision {
  id?: string
  suggestionId: string
  exerciseId: string
  action: 'accepted' | 'dismissed'
  timestamp: number
}

export interface TrainingProgressionSuggestion {
  id: string
  exerciseId: string
  exerciseName: string
  kind: 'advance' | 'regress' | 'hold'
  fromLevel?: number
  toLevel?: number
  toExerciseId?: string
  toExerciseName?: string
  nextTargetReps?: number
  reason: string
  suggestedAt: number
}

// ── Deload ────────────────────────────────────────────────────────────────

export type DeloadTrigger = 'stagnation' | 'readiness_trend'

export interface DeloadSuggestion {
  id: string
  trigger: DeloadTrigger
  reason: string
  suggestedAt: number
}

// ── Analytics ─────────────────────────────────────────────────────────────

export interface ExerciseStrengthEntry {
  exerciseId: string
  exerciseName: string
  currentLevel: number
  trend: 'up' | 'flat' | 'down'
  recentReps: number[]
}

export interface MuscleRadarEntry {
  muscle: TrainingMuscleGroup
  score: number
}

export interface StrengthProfile {
  exercises: ExerciseStrengthEntry[]
  radarData: MuscleRadarEntry[]
}

// ── PRs ──────────────────────────────────────────────────────────────────

export interface PRResult {
  exerciseId: string
  exerciseName: string
  reps: number
  variationLevel: number
  date: string
}

// ── Training types ────────────────────────────────────────────────────────

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
  isPR?: boolean
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
