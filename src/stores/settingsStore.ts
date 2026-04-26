import { create } from 'zustand'
import type { UserSettings } from '../types'
import { getRepository } from '../lib/repositoryRegistry'
import { DEFAULT_SETTINGS } from '../utils/constants'

interface SettingsState {
  settings: UserSettings
  loaded: boolean
  load: () => Promise<void>
  update: (settings: Partial<UserSettings>) => Promise<void>
  reset: () => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  loaded: false,

  load: async () => {
    const settings = await getRepository().getSettings()
    set({ settings, loaded: true })
  },

  update: async (partial) => {
    const updated = { ...get().settings, ...partial }
    await getRepository().updateSettings(partial)
    set({ settings: updated })
  },

  reset: () => set({ settings: { ...DEFAULT_SETTINGS }, loaded: false }),
}))
