import type { ExerciseMediaRepository } from '../repositories/ExerciseMediaRepository'
import { ExerciseMediaLocalStorageRepository } from '../repositories/ExerciseMediaLocalStorageRepository'

let _current: ExerciseMediaRepository = new ExerciseMediaLocalStorageRepository()

export function getExerciseMediaRepository(): ExerciseMediaRepository {
  return _current
}

export function setExerciseMediaRepository(repo: ExerciseMediaRepository): void {
  _current = repo
}
