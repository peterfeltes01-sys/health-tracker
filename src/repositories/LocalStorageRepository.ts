import type { StepEntry, Activity, HydrationEntry, UserSettings } from '../types'
import type { DataRepository } from './DataRepository'
import { DEFAULT_SETTINGS } from '../utils/constants'

const KEYS = {
  steps: 'ht_steps',
  activities: 'ht_activities',
  hydration: 'ht_hydration',
  settings: 'ht_settings',
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export class LocalStorageRepository implements DataRepository {
  private steps(): StepEntry[] {
    return load<StepEntry[]>(KEYS.steps, [])
  }
  private activities(): Activity[] {
    return load<Activity[]>(KEYS.activities, [])
  }
  private hydration(): HydrationEntry[] {
    return load<HydrationEntry[]>(KEYS.hydration, [])
  }

  async getStepsByDate(date: string): Promise<StepEntry[]> {
    return this.steps().filter((s) => s.date === date)
  }

  async getStepsByDateRange(from: string, to: string): Promise<StepEntry[]> {
    return this.steps().filter((s) => s.date >= from && s.date <= to)
  }

  async addSteps(entry: StepEntry): Promise<void> {
    const all = this.steps()
    save(KEYS.steps, [...all, entry])
  }

  async deleteSteps(id: string): Promise<void> {
    save(KEYS.steps, this.steps().filter((s) => s.id !== id))
  }

  async getActivitiesByDate(date: string): Promise<Activity[]> {
    return this.activities().filter((a) => a.date === date)
  }

  async getActivitiesByDateRange(from: string, to: string): Promise<Activity[]> {
    return this.activities().filter((a) => a.date >= from && a.date <= to)
  }

  async addActivity(activity: Activity): Promise<void> {
    save(KEYS.activities, [...this.activities(), activity])
  }

  async updateActivity(activity: Activity): Promise<void> {
    save(KEYS.activities, this.activities().map((a) => (a.id === activity.id ? activity : a)))
  }

  async deleteActivity(id: string): Promise<void> {
    save(KEYS.activities, this.activities().filter((a) => a.id !== id))
  }

  async getHydrationByDate(date: string): Promise<HydrationEntry[]> {
    return this.hydration().filter((h) => h.date === date)
  }

  async getHydrationByDateRange(from: string, to: string): Promise<HydrationEntry[]> {
    return this.hydration().filter((h) => h.date >= from && h.date <= to)
  }

  async addHydration(entry: HydrationEntry): Promise<void> {
    save(KEYS.hydration, [...this.hydration(), entry])
  }

  async deleteHydration(id: string): Promise<void> {
    save(KEYS.hydration, this.hydration().filter((h) => h.id !== id))
  }

  async getSettings(): Promise<UserSettings> {
    const stored = load<Partial<UserSettings>>(KEYS.settings, {})
    return { ...DEFAULT_SETTINGS, ...stored }
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    const current = await this.getSettings()
    save(KEYS.settings, { ...current, ...settings })
  }

  async exportAll(): Promise<string> {
    return JSON.stringify({
      steps: this.steps(),
      activities: this.activities(),
      hydration: this.hydration(),
      settings: await this.getSettings(),
      exportedAt: new Date().toISOString(),
    }, null, 2)
  }

  async importAll(data: string): Promise<void> {
    const parsed = JSON.parse(data)
    if (parsed.steps) save(KEYS.steps, parsed.steps)
    if (parsed.activities) save(KEYS.activities, parsed.activities)
    if (parsed.hydration) save(KEYS.hydration, parsed.hydration)
    if (parsed.settings) save(KEYS.settings, parsed.settings)
  }

  async clearAll(): Promise<void> {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  }
}

export const repository = new LocalStorageRepository()
