import { create } from 'zustand'
import type { BloodSugarEntry } from '../types'
import { getRepository } from '../lib/repositoryRegistry'

interface BloodSugarState {
  entries: BloodSugarEntry[]
  loading: boolean
  load: (from?: string, to?: string) => Promise<void>
  add: (entry: Omit<BloodSugarEntry, 'id'>) => Promise<void>
  delete: (id: string) => Promise<void>
  reset: () => void
}

export const useBloodSugarStore = create<BloodSugarState>((set, get) => ({
  entries: [],
  loading: false,

  load: async (from, to) => {
    set({ loading: true })
    const entries = await getRepository().getBloodSugarEntries(from, to)
    set({ entries, loading: false })
  },

  add: async (entry) => {
    const id = await getRepository().addBloodSugarEntry(entry)
    set({ entries: [...get().entries, { ...entry, id }].sort((a, b) => a.date.localeCompare(b.date)) })
  },

  delete: async (id) => {
    await getRepository().deleteBloodSugarEntry(id)
    set({ entries: get().entries.filter((e) => e.id !== id) })
  },

  reset: () => set({ entries: [], loading: false }),
}))
