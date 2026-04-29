import { create } from 'zustand'
import type { BloodPressureEntry } from '../types'
import { getRepository } from '../lib/repositoryRegistry'
import { classifyBP } from '../lib/bloodPressure'

interface BPState {
  entries: BloodPressureEntry[]
  loading: boolean
  load: (from?: string, to?: string) => Promise<void>
  add: (entry: Omit<BloodPressureEntry, 'id' | 'category'>) => Promise<string>
  update: (entry: BloodPressureEntry) => Promise<void>
  delete: (id: string) => Promise<void>
  reset: () => void
}

export const useBloodPressureStore = create<BPState>((set, get) => ({
  entries: [],
  loading: false,

  load: async (from, to) => {
    set({ loading: true })
    const entries = await getRepository().getBloodPressureEntries(from, to)
    set({ entries, loading: false })
  },

  add: async (entry) => {
    const id = await getRepository().addBloodPressureEntry(entry)
    const newEntry = await getRepository().getBloodPressureEntries(entry.date, entry.date)
    const added = newEntry.find((e) => e.id === id)
    if (added) set({ entries: [...get().entries, added] })
    return id
  },

  update: async (entry) => {
    await getRepository().updateBloodPressureEntry(entry)
    const category = classifyBP(entry.systolic, entry.diastolic)
    set({ entries: get().entries.map((e) => (e.id === entry.id ? { ...entry, category } : e)) })
  },

  delete: async (id) => {
    await getRepository().deleteBloodPressureEntry(id)
    set({ entries: get().entries.filter((e) => e.id !== id) })
  },

  reset: () => set({ entries: [], loading: false }),
}))
