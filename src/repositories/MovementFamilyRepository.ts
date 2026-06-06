import type { MovementFamily } from '../types/training'

export interface MovementFamilyRepository {
  getAll(): Promise<MovementFamily[]>
  getById(id: string): Promise<MovementFamily | null>
  getByExerciseId(exerciseId: string): Promise<MovementFamily | null>
  upsert(family: MovementFamily): Promise<void>
  delete(id: string): Promise<void>
}
