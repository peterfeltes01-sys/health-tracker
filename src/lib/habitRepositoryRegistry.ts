import type { HabitRepository } from '../repositories/HabitRepository'
import { HabitLocalRepository } from '../repositories/HabitLocalRepository'

let _current: HabitRepository = new HabitLocalRepository()

export function getHabitRepository(): HabitRepository {
  return _current
}

export function setHabitRepository(repo: HabitRepository): void {
  _current = repo
}
