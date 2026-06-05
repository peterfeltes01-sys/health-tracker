import type { WorkoutRepository } from '../repositories/WorkoutRepository'
import { WorkoutLocalStorageRepository } from '../repositories/WorkoutLocalStorageRepository'

let _current: WorkoutRepository = new WorkoutLocalStorageRepository()

export function getWorkoutRepository(): WorkoutRepository {
  return _current
}

export function setWorkoutRepository(repo: WorkoutRepository): void {
  _current = repo
}
