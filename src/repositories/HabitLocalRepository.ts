import type { HabitRepository } from './HabitRepository'
import type { Habit, HabitEntry } from '../types/habits'
import { generateId } from '../utils/calculations'

function loadList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function saveList<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export class HabitLocalRepository implements HabitRepository {
  private readonly hKey = 'ht_habits'
  private readonly eKey = 'ht_habitEntries'

  async getHabits(): Promise<Habit[]> {
    return loadList<Habit>(this.hKey).sort((a, b) => a.order - b.order)
  }

  async addHabit(habit: Omit<Habit, 'id'>): Promise<string> {
    const id = generateId()
    saveList(this.hKey, [...loadList<Habit>(this.hKey), { ...habit, id }])
    return id
  }

  async updateHabit(habit: Habit): Promise<void> {
    saveList(
      this.hKey,
      loadList<Habit>(this.hKey).map((h) => (h.id === habit.id ? habit : h))
    )
  }

  async getEntriesByDate(date: string): Promise<HabitEntry[]> {
    return loadList<HabitEntry>(this.eKey).filter((e) => e.date === date)
  }

  async getEntriesByDateRange(from: string, to: string): Promise<HabitEntry[]> {
    return loadList<HabitEntry>(this.eKey).filter((e) => e.date >= from && e.date <= to)
  }

  async upsertEntry(entry: HabitEntry): Promise<void> {
    const all = loadList<HabitEntry>(this.eKey)
    const idx = all.findIndex((e) => e.id === entry.id)
    if (idx >= 0) {
      all[idx] = entry
      saveList(this.eKey, all)
    } else {
      saveList(this.eKey, [...all, entry])
    }
  }

  async deleteEntry(id: string): Promise<void> {
    saveList(this.eKey, loadList<HabitEntry>(this.eKey).filter((e) => e.id !== id))
  }
}
