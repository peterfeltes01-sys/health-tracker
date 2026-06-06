import type { ExerciseMediaSettings } from '../types/routine'

export interface ExerciseMediaRepository {
  getOverride(exerciseId: string): Promise<ExerciseMediaSettings | null>
  upsertOverride(override: ExerciseMediaSettings): Promise<void>
  deleteOverride(exerciseId: string): Promise<void>
}
