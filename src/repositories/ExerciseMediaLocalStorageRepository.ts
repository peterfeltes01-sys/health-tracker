import type { ExerciseMediaRepository } from './ExerciseMediaRepository'
import type { ExerciseMediaSettings } from '../types/routine'

const KEY = 'ht_exercise_media_settings'

function load(): Record<string, ExerciseMediaSettings> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<string, ExerciseMediaSettings>) : {}
  } catch {
    return {}
  }
}

function save(data: Record<string, ExerciseMediaSettings>): void {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export class ExerciseMediaLocalStorageRepository implements ExerciseMediaRepository {
  async getOverride(exerciseId: string): Promise<ExerciseMediaSettings | null> {
    return load()[exerciseId] ?? null
  }

  async upsertOverride(override: ExerciseMediaSettings): Promise<void> {
    const all = load()
    all[override.exerciseId] = override
    save(all)
  }

  async deleteOverride(exerciseId: string): Promise<void> {
    const all = load()
    delete all[exerciseId]
    save(all)
  }
}
