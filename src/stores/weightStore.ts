import { create } from 'zustand'
import type { WeightEntry } from '../types'
import { getRepository } from '../lib/repositoryRegistry'

interface WeightState {
  entries: WeightEntry[]
  loading: boolean
  load: (from?: string, to?: string) => Promise<void>
  upsert: (entry: Omit<WeightEntry, 'id'>) => Promise<void>
  delete: (id: string) => Promise<void>
  reset: () => void
}

export const useWeightStore = create<WeightState>((set, get) => ({
  entries: [],
  loading: false,

  load: async (from, to) => {
    set({ loading: true })
    const entries = await getRepository().getWeightEntries(from, to)
    set({ entries, loading: false })
  },

  upsert: async (entry) => {
    await getRepository().upsertWeightEntry(entry)
    const id = entry.date
    const existing = get().entries.filter((e) => e.id !== id)
    set({ entries: [...existing, { ...entry, id }].sort((a, b) => a.date.localeCompare(b.date)) })
  },

  delete: async (id) => {
    await getRepository().deleteWeightEntry(id)
    set({ entries: get().entries.filter((e) => e.id !== id) })
  },

  reset: () => set({ entries: [], loading: false }),
}))
