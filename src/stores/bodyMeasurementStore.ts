import { create } from 'zustand'
import type { BodyMeasurementEntry } from '../types'
import { getRepository } from '../lib/repositoryRegistry'

interface BodyMeasurementState {
  entries: BodyMeasurementEntry[]
  loading: boolean
  load: (from?: string, to?: string) => Promise<void>
  add: (entry: Omit<BodyMeasurementEntry, 'id'>) => Promise<void>
  delete: (id: string) => Promise<void>
  reset: () => void
}

export const useBodyMeasurementStore = create<BodyMeasurementState>((set, get) => ({
  entries: [],
  loading: false,

  load: async (from, to) => {
    set({ loading: true })
    const entries = await getRepository().getBodyMeasurements(from, to)
    set({ entries, loading: false })
  },

  add: async (entry) => {
    const id = await getRepository().addBodyMeasurement(entry)
    set({ entries: [...get().entries, { ...entry, id }].sort((a, b) => a.date.localeCompare(b.date)) })
  },

  delete: async (id) => {
    await getRepository().deleteBodyMeasurement(id)
    set({ entries: get().entries.filter((e) => e.id !== id) })
  },

  reset: () => set({ entries: [], loading: false }),
}))
