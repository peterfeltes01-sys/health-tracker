import type { Habit, HabitEntry } from '../types/habits'

export interface HabitRepository {
  getHabits(): Promise<Habit[]>
  addHabit(habit: Omit<Habit, 'id'>): Promise<string>
  updateHabit(habit: Habit): Promise<void>
  getEntriesByDate(date: string): Promise<HabitEntry[]>
  getEntriesByDateRange(from: string, to: string): Promise<HabitEntry[]>
  upsertEntry(entry: HabitEntry): Promise<void>
  deleteEntry(id: string): Promise<void>
}
