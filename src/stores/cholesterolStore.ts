import { create } from 'zustand'
import type { CholesterolEntry } from '../types'
import { getRepository } from '../lib/repositoryRegistry'

interface CholesterolState {
  entries: CholesterolEntry[]
  loading: boolean
  load: (from?: string, to?: string) => Promise<void>
  add: (entry: Omit<CholesterolEntry, 'id'>) => Promise<void>
  delete: (id: string) => Promise<void>
  reset: () => void
}

export const useCholesterolStore = create<CholesterolState>((set, get) => ({
  entries: [],
  loading: false,

  load: async (from, to) => {
    set({ loading: true })
    const entries = await getRepository().getCholesterolEntries(from, to)
    set({ entries, loading: false })
  },

  add: async (entry) => {
    const id = await getRepository().addCholesterolEntry(entry)
    set({ entries: [...get().entries, { ...entry, id }].sort((a, b) => a.date.localeCompare(b.date)) })
  },

  delete: async (id) => {
    await getRepository().deleteCholesterolEntry(id)
    set({ entries: get().entries.filter((e) => e.id !== id) })
  },

  reset: () => set({ entries: [], loading: false }),
}))
