import { create } from 'zustand'
import { getHabitRepository } from '../lib/habitRepositoryRegistry'
import type { Habit, HabitEntry } from '../types/habits'

interface HabitState {
  habits: Habit[]
  entries: HabitEntry[]
  loading: boolean

  load: () => Promise<void>
  loadEntries: (from: string, to: string) => Promise<void>

  addHabit: (data: Omit<Habit, 'id' | 'createdAt' | 'archivedAt' | 'order'>) => Promise<void>
  updateHabit: (habit: Habit) => Promise<void>
  archiveHabit: (id: string) => Promise<void>
  unarchiveHabit: (id: string) => Promise<void>
  moveHabitUp: (id: string) => Promise<void>
  moveHabitDown: (id: string) => Promise<void>

  toggleEntry: (habit: Habit, date: string) => Promise<void>
  setEntryValue: (habit: Habit, date: string, value: number, note?: string) => Promise<void>
  setEntryNote: (habitId: string, date: string, note: string) => Promise<void>

  reset: () => void
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  entries: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const habits = await getHabitRepository().getHabits()
    set({ habits, loading: false })
  },

  loadEntries: async (from, to) => {
    const entries = await getHabitRepository().getEntriesByDateRange(from, to)
    set({ entries })
  },

  addHabit: async (data) => {
    const active = get().habits.filter((h) => !h.archivedAt)
    const order = active.length > 0 ? Math.max(...active.map((h) => h.order)) + 1 : 0
    const habitData: Omit<Habit, 'id'> = {
      ...data,
      order,
      createdAt: new Date().toISOString(),
      archivedAt: null,
    }
    const id = await getHabitRepository().addHabit(habitData)
    set({ habits: [...get().habits, { ...habitData, id }] })
  },

  updateHabit: async (habit) => {
    await getHabitRepository().updateHabit(habit)
    set({ habits: get().habits.map((h) => (h.id === habit.id ? habit : h)) })
  },

  archiveHabit: async (id) => {
    const habit = get().habits.find((h) => h.id === id)
    if (!habit) return
    const updated = { ...habit, archivedAt: new Date().toISOString() }
    await getHabitRepository().updateHabit(updated)
    set({ habits: get().habits.map((h) => (h.id === id ? updated : h)) })
  },

  unarchiveHabit: async (id) => {
    const habit = get().habits.find((h) => h.id === id)
    if (!habit) return
    const updated = { ...habit, archivedAt: null }
    await getHabitRepository().updateHabit(updated)
    set({ habits: get().habits.map((h) => (h.id === id ? updated : h)) })
  },

  moveHabitUp: async (id) => {
    const active = get().habits
      .filter((h) => !h.archivedAt)
      .sort((a, b) => a.order - b.order)
    const idx = active.findIndex((h) => h.id === id)
    if (idx <= 0) return
    const swapped = [...active]
    ;[swapped[idx - 1], swapped[idx]] = [swapped[idx], swapped[idx - 1]]
    const reordered = swapped.map((h, i) => ({ ...h, order: i }))
    for (const h of reordered) await getHabitRepository().updateHabit(h)
    set({ habits: get().habits.map((h) => reordered.find((r) => r.id === h.id) ?? h) })
  },

  moveHabitDown: async (id) => {
    const active = get().habits
      .filter((h) => !h.archivedAt)
      .sort((a, b) => a.order - b.order)
    const idx = active.findIndex((h) => h.id === id)
    if (idx < 0 || idx >= active.length - 1) return
    const swapped = [...active]
    ;[swapped[idx], swapped[idx + 1]] = [swapped[idx + 1], swapped[idx]]
    const reordered = swapped.map((h, i) => ({ ...h, order: i }))
    for (const h of reordered) await getHabitRepository().updateHabit(h)
    set({ habits: get().habits.map((h) => reordered.find((r) => r.id === h.id) ?? h) })
  },

  toggleEntry: async (habit, date) => {
    const entries = get().entries
    const id = `${habit.id}_${date}`
    const existing = entries.find((e) => e.id === id)
    const completed = existing ? !existing.completed : true

    const entry: HabitEntry = {
      id,
      habitId: habit.id,
      date,
      completed,
      value: existing?.value ?? null,
      note: existing?.note ?? null,
      loggedAt: new Date().toISOString(),
      targetValueSnapshot: habit.targetValue,
      typeSnapshot: habit.type,
    }

    set({
      entries: existing
        ? entries.map((e) => (e.id === id ? entry : e))
        : [...entries, entry],
    })
    await getHabitRepository().upsertEntry(entry)
  },

  setEntryValue: async (habit, date, value, note) => {
    const entries = get().entries
    const id = `${habit.id}_${date}`
    const existing = entries.find((e) => e.id === id)
    const target = habit.targetValue ?? 0
    const completed =
      habit.polarity === 'positive' ? value >= target : target === 0 ? true : value <= target

    const entry: HabitEntry = {
      id,
      habitId: habit.id,
      date,
      completed,
      value,
      note: note ?? existing?.note ?? null,
      loggedAt: new Date().toISOString(),
      targetValueSnapshot: habit.targetValue,
      typeSnapshot: habit.type,
    }

    set({
      entries: existing
        ? entries.map((e) => (e.id === id ? entry : e))
        : [...entries, entry],
    })
    await getHabitRepository().upsertEntry(entry)
  },

  setEntryNote: async (habitId, date, note) => {
    const entries = get().entries
    const id = `${habitId}_${date}`
    const existing = entries.find((e) => e.id === id)
    if (!existing) return
    const updated = { ...existing, note, loggedAt: new Date().toISOString() }
    set({ entries: entries.map((e) => (e.id === id ? updated : e)) })
    await getHabitRepository().upsertEntry(updated)
  },

  reset: () => set({ habits: [], entries: [], loading: false }),
}))
