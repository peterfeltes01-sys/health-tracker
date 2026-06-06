import type { RoutineRepository } from '../repositories/RoutineRepository'
import { RoutineLocalStorageRepository } from '../repositories/RoutineLocalStorageRepository'

let _current: RoutineRepository = new RoutineLocalStorageRepository()

export function getRoutineRepository(): RoutineRepository {
  return _current
}

export function setRoutineRepository(repo: RoutineRepository): void {
  _current = repo
}
