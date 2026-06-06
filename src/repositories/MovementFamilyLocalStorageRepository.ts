import type { MovementFamilyRepository } from './MovementFamilyRepository'
import type { MovementFamily } from '../types/training'
import { SEED_MOVEMENT_FAMILIES } from '../data/movementFamilies'

const KEY = 'ht_movement_families'

function load(): MovementFamily[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as MovementFamily[]
  } catch {
    // ignore
  }
  // Fall back to seed data so families are available without network
  return SEED_MOVEMENT_FAMILIES
}

function save(families: MovementFamily[]): void {
  localStorage.setItem(KEY, JSON.stringify(families))
}

export class MovementFamilyLocalStorageRepository implements MovementFamilyRepository {
  async getAll(): Promise<MovementFamily[]> {
    return load()
  }

  async getById(id: string): Promise<MovementFamily | null> {
    return load().find((f) => f.id === id) ?? null
  }

  async getByExerciseId(exerciseId: string): Promise<MovementFamily | null> {
    return load().find((f) => f.levels.includes(exerciseId)) ?? null
  }

  async upsert(family: MovementFamily): Promise<void> {
    const all = load().filter((f) => f.id !== family.id)
    save([...all, family])
  }

  async delete(id: string): Promise<void> {
    save(load().filter((f) => f.id !== id))
  }
}
