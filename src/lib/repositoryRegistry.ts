import type { DataRepository } from '../repositories/DataRepository'
import { LocalStorageRepository } from '../repositories/LocalStorageRepository'

let _current: DataRepository = new LocalStorageRepository()

export function getRepository(): DataRepository {
  return _current
}

export function setRepository(repo: DataRepository): void {
  _current = repo
}
