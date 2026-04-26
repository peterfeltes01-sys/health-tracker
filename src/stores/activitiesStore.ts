import { create } from 'zustand'
import type { Activity } from '../types'
import { repository } from '../repositories/LocalStorageRepository'

interface ActivitiesState {
  entries: Activity[]
  loading: boolean
  loadByDate: (date: string) => Promise<void>
  loadByRange: (from: string, to: string) => Promise<void>
  addActivity: (activity: Activity) => Promise<void>
  updateActivity: (activity: Activity) => Promise<void>
  deleteActivity: (id: string) => Promise<void>
  getForDate: (date: string) => Activity[]
}

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
  entries: [],
  loading: false,

  loadByDate: async (date) => {
    set({ loading: true })
    const entries = await repository.getActivitiesByDate(date)
    set({ entries, loading: false })
  },

  loadByRange: async (from, to) => {
    set({ loading: true })
    const entries = await repository.getActivitiesByDateRange(from, to)
    set({ entries, loading: false })
  },

  addActivity: async (activity) => {
    await repository.addActivity(activity)
    set({ entries: [...get().entries, activity] })
  },

  updateActivity: async (activity) => {
    await repository.updateActivity(activity)
    set({ entries: get().entries.map((a) => (a.id === activity.id ? activity : a)) })
  },

  deleteActivity: async (id) => {
    await repository.deleteActivity(id)
    set({ entries: get().entries.filter((a) => a.id !== id) })
  },

  getForDate: (date) => get().entries.filter((a) => a.date === date),
}))
