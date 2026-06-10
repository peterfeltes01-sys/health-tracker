import type { ReadinessRepository } from '../features/training/repositories/ReadinessRepository'
import { ReadinessLocalStorageRepository } from '../features/training/repositories/ReadinessLocalStorageRepository'

let _repo: ReadinessRepository = new ReadinessLocalStorageRepository()

export function getReadinessRepository(): ReadinessRepository {
  return _repo
}

export function setReadinessRepository(repo: ReadinessRepository): void {
  _repo = repo
}
