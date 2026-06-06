import type { RoutineRepository } from './RoutineRepository'
import type { Routine } from '../types/routine'
import { generateId } from '../utils/calculations'

const KEY = 'ht_routines'

function load(): Routine[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Routine[]) : []
  } catch {
    return []
  }
}

function save(routines: Routine[]): void {
  localStorage.setItem(KEY, JSON.stringify(routines))
}

export class RoutineLocalStorageRepository implements RoutineRepository {
  async listRoutines(): Promise<Routine[]> {
    return load().sort((a, b) => a.createdAt - b.createdAt)
  }

  async getRoutine(id: string): Promise<Routine | null> {
    return load().find((r) => r.id === id) ?? null
  }

  async createRoutine(data: Omit<Routine, 'id'>): Promise<Routine> {
    const routine: Routine = { ...data, id: generateId() }
    save([...load(), routine])
    return routine
  }

  async updateRoutine(id: string, patch: Partial<Omit<Routine, 'id'>>): Promise<void> {
    const all = load()
    save(all.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r)))
  }

  async deleteRoutine(id: string): Promise<void> {
    save(load().filter((r) => r.id !== id))
  }
}
