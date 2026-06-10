import type { ProgressionDecisionRepository } from '../features/training/repositories/ProgressionDecisionRepository'
import { ProgressionDecisionLocalStorageRepository } from '../features/training/repositories/ProgressionDecisionLocalStorageRepository'

let _repo: ProgressionDecisionRepository = new ProgressionDecisionLocalStorageRepository()

export function getProgressionDecisionRepository(): ProgressionDecisionRepository {
  return _repo
}

export function setProgressionDecisionRepository(repo: ProgressionDecisionRepository): void {
  _repo = repo
}
