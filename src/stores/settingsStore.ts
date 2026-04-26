import { create } from 'zustand'
import type { UserSettings } from '../types'
import { repository } from '../repositories/LocalStorageRepository'
import { DEFAULT_SETTINGS } from '../utils/constants'

interface SettingsState {
  settings: UserSettings
  loaded: boolean
  load: () => Promise<void>
  update: (settings: Partial<UserSettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    const settings = await repository.getSettings()
    set({ settings, loaded: true })
  },

  update: async (partial) => {
    const updated = { ...get().settings, ...partial }
    await repository.updateSettings(partial)
    set({ settings: updated })
  },
}))
