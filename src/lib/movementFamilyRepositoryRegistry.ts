import type { MovementFamilyRepository } from '../repositories/MovementFamilyRepository'
import { MovementFamilyLocalStorageRepository } from '../repositories/MovementFamilyLocalStorageRepository'

let _repo: MovementFamilyRepository = new MovementFamilyLocalStorageRepository()

export function getMovementFamilyRepository(): MovementFamilyRepository {
  return _repo
}

export function setMovementFamilyRepository(repo: MovementFamilyRepository): void {
  _repo = repo
}
