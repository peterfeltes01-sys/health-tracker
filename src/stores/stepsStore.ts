import { create } from 'zustand'
import type { StepEntry } from '../types'
import { getRepository } from '../lib/repositoryRegistry'
import { generateId, toISODate } from '../utils/calculations'

interface StepsState {
  entries: StepEntry[]
  loading: boolean
  loadByDate: (date: string) => Promise<void>
  loadByRange: (from: string, to: string) => Promise<void>
  addSteps: (steps: number, source?: StepEntry['source']) => Promise<void>
  addStepsManual: (steps: number, date: string, time?: string) => Promise<void>
  setTotalForDate: (steps: number, date: string, source?: StepEntry['source']) => Promise<void>
  seedIfEmpty: (today: string, dailyValues: number[]) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  getTotalForDate: (date: string) => number
  reset: () => void
}

export const useStepsStore = create<StepsState>((set, get) => ({
  entries: [],
  loading: false,

  loadByDate: async (date) => {
    set({ loading: true })
    const entries = await getRepository().getStepsByDate(date)
    set({ entries, loading: false })
  },

  loadByRange: async (from, to) => {
    set({ loading: true })
    const entries = await getRepository().getStepsByDateRange(from, to)
    set({ entries, loading: false })
  },

  addSteps: async (steps, source = 'quick_add') => {
    const today = toISODate(new Date())
    const entry: StepEntry = {
      id: generateId(),
      date: today,
      steps,
      timestamp: new Date().toISOString(),
      source,
    }
    await getRepository().addSteps(entry)
    set({ entries: [...get().entries, entry] })
  },

  addStepsManual: async (steps, date, time) => {
    const entry: StepEntry = {
      id: generateId(),
      date,
      steps,
      timestamp: time ? `${date}T${time}:00.000Z` : new Date().toISOString(),
      source: 'manual',
    }
    await getRepository().addSteps(entry)
    set({ entries: [...get().entries, entry] })
  },

  setTotalForDate: async (steps, date, source = 'manual') => {
    const repo = getRepository()
    const existing = await repo.getStepsByDate(date)
    await Promise.all(existing.map((e) => repo.deleteSteps(e.id)))
    const entry: StepEntry = {
      id: generateId(),
      date,
      steps,
      timestamp: new Date().toISOString(),
      source,
    }
    await repo.addSteps(entry)
    const others = get().entries.filter((e) => e.date !== date)
    set({ entries: [...others, entry] })
  },

  seedIfEmpty: async (today, dailyValues) => {
    const repo = getRepository()
    const offsets = dailyValues.length
    const fromDate = new Date(today)
    fromDate.setDate(fromDate.getDate() - (offsets - 1))
    const from = toISODate(fromDate)
    const existing = await repo.getStepsByDateRange(from, today)
    if (existing.length > 0) return
    const created: StepEntry[] = []
    for (let i = 0; i < offsets; i++) {
      const d = new Date(fromDate)
      d.setDate(fromDate.getDate() + i)
      const date = toISODate(d)
      const entry: StepEntry = {
        id: generateId(),
        date,
        steps: dailyValues[i],
        timestamp: `${date}T20:00:00.000Z`,
        source: 'manual',
      }
      await repo.addSteps(entry)
      created.push(entry)
    }
    set({ entries: [...get().entries, ...created] })
  },

  deleteEntry: async (id) => {
    await getRepository().deleteSteps(id)
    set({ entries: get().entries.filter((e) => e.id !== id) })
  },

  getTotalForDate: (date) =>
    get()
      .entries.filter((e) => e.date === date)
      .reduce((sum, e) => sum + e.steps, 0),

  reset: () => set({ entries: [], loading: false }),
}))
