import { create } from 'zustand'
import type { HydrationEntry } from '../types'
import { getRepository } from '../lib/repositoryRegistry'
import { generateId, toISODate } from '../utils/calculations'

interface HydrationState {
  entries: HydrationEntry[]
  loading: boolean
  loadByDate: (date: string) => Promise<void>
  loadByRange: (from: string, to: string) => Promise<void>
  addHydration: (amountMl: number, drinkType?: HydrationEntry['drinkType']) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  getTotalForDate: (date: string) => number
  reset: () => void
}

export const useHydrationStore = create<HydrationState>((set, get) => ({
  entries: [],
  loading: false,

  loadByDate: async (date) => {
    set({ loading: true })
    const entries = await getRepository().getHydrationByDate(date)
    set({ entries, loading: false })
  },

  loadByRange: async (from, to) => {
    set({ loading: true })
    const entries = await getRepository().getHydrationByDateRange(from, to)
    set({ entries, loading: false })
  },

  addHydration: async (amountMl, drinkType = 'water') => {
    const today = toISODate(new Date())
    const entry: HydrationEntry = {
      id: generateId(),
      date: today,
      amountMl,
      drinkType,
      timestamp: new Date().toISOString(),
    }
    await getRepository().addHydration(entry)
    set({ entries: [...get().entries, entry] })
  },

  deleteEntry: async (id) => {
    await getRepository().deleteHydration(id)
    set({ entries: get().entries.filter((e) => e.id !== id) })
  },

  getTotalForDate: (date) =>
    get()
      .entries.filter((e) => e.date === date)
      .reduce((sum, e) => sum + e.amountMl, 0),

  reset: () => set({ entries: [], loading: false }),
}))
