export type ExerciseMode = 'bands' | 'bodyweight' | 'chair'

export type MuscleGroup =
  | 'brust'
  | 'ruecken'
  | 'schultern'
  | 'arme'
  | 'beine'
  | 'gesaess'
  | 'rumpf'
  | 'ganzkoerper'

export interface Exercise {
  id: string
  name: string
  modes: ExerciseMode[]
  primaryMuscles: MuscleGroup[]
  secondaryMuscles: MuscleGroup[]
  difficulty: 'leicht' | 'mittel' | 'schwer'
  target:
    | { type: 'reps'; sets: number; reps: number }
    | { type: 'duration'; sets: number; seconds: number }
  basePoints: number
  mediaUrls: string[]
  instructions: string[]
  chairVariantNote?: string
}

export interface PerformedExercise {
  exerciseId: string
  nameSnapshot: string
  basePointsSnapshot: number
  targetSnapshot: Exercise['target']
  actual: { sets: number; reps?: number; seconds?: number }
  pointsEarned: number
  metTarget: boolean
}

export interface WorkoutSession {
  id: string
  date: string
  startedAt: number
  completedAt: number
  durationSeconds: number
  mode: ExerciseMode
  performed: PerformedExercise[]
  totalPoints: number
  bonusPoints: number
}

export interface WorkoutStats {
  totalPoints: number
  pointBalance: number
  currentStreakDays: number
  longestStreakDays: number
  totalSessions: number
  totalMinutes: number
  lastSessionDate: string | null
}

export interface WeeklyGoal {
  weekId: string
  targetDays: number
  targetPoints: number
  trainedDays: number
  earnedPoints: number
  achieved: boolean
  achievedAt: number | null
}

export type MedalTier = 'bronze' | 'silber' | 'gold'

export interface Achievement {
  id: string
  category: 'streak' | 'weekly' | 'points' | 'minutes' | 'special'
  tier: MedalTier
  title: string
  description: string
  earnedAt: number
}

export interface ActiveSession {
  mode: ExerciseMode
  exercises: Exercise[]
  currentIndex: number
  startedAt: number
  performed: PerformedExercise[]
}

// ── Custom Media & Exercises ────────────────────────────────────────────────

export interface MediaItem {
  type: 'image' | 'video'
  url: string
  storagePath: string
  thumbnailUrl?: string
  sizeBytes: number
  uploadedAt: number
}

export interface ExerciseMediaOverride {
  exerciseId: string
  strategy: 'append' | 'replace'
  customMedia: MediaItem[]
  updatedAt: number
}

export interface CustomExercise extends Omit<Exercise, 'mediaUrls'> {
  isCustom: true
  ownerUid: string
  media: MediaItem[]
  createdAt: number
}

export const DEFAULT_WORKOUT_STATS: WorkoutStats = {
  totalPoints: 0,
  pointBalance: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  totalSessions: 0,
  totalMinutes: 0,
  lastSessionDate: null,
}

export const DEFAULT_WEEKLY_TARGET_DAYS = 5
export const DEFAULT_WEEKLY_TARGET_POINTS = 250
