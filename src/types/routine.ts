export interface ExerciseTarget {
  mode: 'reps' | 'duration'
  sets?: number
  reps?: number
  durationSec?: number
}

export interface RoutineExercise {
  exerciseId: string
  order: number
  target: ExerciseTarget
}

export interface Routine {
  id: string
  name: string
  exercises: RoutineExercise[]
  schedule: { type: 'daily' }
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface CustomMediaItem {
  id: string
  url: string
  storagePath: string
  uploadedAt: number
}

export interface ExerciseMediaSettings {
  exerciseId: string
  hiddenDefaults: string[]
  customMedia: CustomMediaItem[]
  primaryMediaId: string | null
  updatedAt: number
}

export interface ResolvedMedia {
  id: string
  url: string
  kind: 'default' | 'custom'
}
