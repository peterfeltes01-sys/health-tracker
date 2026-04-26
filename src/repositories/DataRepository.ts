import type { StepEntry, Activity, HydrationEntry, UserSettings } from '../types'

export interface DataRepository {
  getStepsByDate(date: string): Promise<StepEntry[]>
  getStepsByDateRange(from: string, to: string): Promise<StepEntry[]>
  addSteps(entry: StepEntry): Promise<void>
  deleteSteps(id: string): Promise<void>

  getActivitiesByDate(date: string): Promise<Activity[]>
  getActivitiesByDateRange(from: string, to: string): Promise<Activity[]>
  addActivity(activity: Activity): Promise<void>
  updateActivity(activity: Activity): Promise<void>
  deleteActivity(id: string): Promise<void>

  getHydrationByDate(date: string): Promise<HydrationEntry[]>
  getHydrationByDateRange(from: string, to: string): Promise<HydrationEntry[]>
  addHydration(entry: HydrationEntry): Promise<void>
  deleteHydration(id: string): Promise<void>

  getSettings(): Promise<UserSettings>
  updateSettings(settings: Partial<UserSettings>): Promise<void>

  exportAll(): Promise<string>
  importAll(data: string): Promise<void>
  clearAll(): Promise<void>
}
