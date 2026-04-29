import type {
  StepEntry,
  Activity,
  HydrationEntry,
  UserSettings,
  MealEntry,
  MealType,
  MealTemplate,
  FoodProduct,
  WeightEntry,
  BloodPressureEntry,
} from '../types'
import type { DataRepository } from './DataRepository'
import { DEFAULT_SETTINGS } from '../utils/constants'
import { generateId } from '../utils/calculations'
import { classifyBP } from '../lib/bloodPressure'

const KEYS = {
  steps: 'ht_steps',
  activities: 'ht_activities',
  hydration: 'ht_hydration',
  settings: 'ht_settings',
  meals: 'ht_meals',
  customProducts: 'ht_customProducts',
  mealTemplates: 'ht_mealTemplates',
  recentProducts: 'ht_recentProducts',
  weights: 'ht_weights',
  bloodPressure: 'ht_bloodPressure',
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
  private steps(): StepEntry[] { return load<StepEntry[]>(KEYS.steps, []) }
  private activities(): Activity[] { return load<Activity[]>(KEYS.activities, []) }
  private hydration(): HydrationEntry[] { return load<HydrationEntry[]>(KEYS.hydration, []) }
  private meals(): MealEntry[] { return load<MealEntry[]>(KEYS.meals, []) }
  private customProducts(): FoodProduct[] { return load<FoodProduct[]>(KEYS.customProducts, []) }
  private mealTemplates(): MealTemplate[] { return load<MealTemplate[]>(KEYS.mealTemplates, []) }
  private recentProducts(): FoodProduct[] { return load<FoodProduct[]>(KEYS.recentProducts, []) }
  private weights(): WeightEntry[] { return load<WeightEntry[]>(KEYS.weights, []) }
  private bloodPressure(): BloodPressureEntry[] { return load<BloodPressureEntry[]>(KEYS.bloodPressure, []) }

  // ── Steps ──────────────────────────────────────────────────────────────────

  async getStepsByDate(date: string): Promise<StepEntry[]> {
    return this.steps().filter((s) => s.date === date)
  }
  async getStepsByDateRange(from: string, to: string): Promise<StepEntry[]> {
    return this.steps().filter((s) => s.date >= from && s.date <= to)
  }
  async addSteps(entry: StepEntry): Promise<void> {
    save(KEYS.steps, [...this.steps(), entry])
  }
  async deleteSteps(id: string): Promise<void> {
    save(KEYS.steps, this.steps().filter((s) => s.id !== id))
  }

  // ── Activities ─────────────────────────────────────────────────────────────

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

  // ── Hydration ──────────────────────────────────────────────────────────────

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

  // ── Settings ───────────────────────────────────────────────────────────────

  async getSettings(): Promise<UserSettings> {
    const stored = load<Partial<UserSettings>>(KEYS.settings, {})
    return { ...DEFAULT_SETTINGS, ...stored }
  }
  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    const current = await this.getSettings()
    save(KEYS.settings, { ...current, ...settings })
  }

  // ── Nutrition / Meals ──────────────────────────────────────────────────────

  async getMealsByDate(date: string): Promise<MealEntry[]> {
    return this.meals().filter((m) => m.date === date)
  }
  async getMealsByDateRange(from: string, to: string): Promise<MealEntry[]> {
    return this.meals().filter((m) => m.date >= from && m.date <= to)
  }
  async addMeal(meal: Omit<MealEntry, 'id'>): Promise<string> {
    const id = generateId()
    save(KEYS.meals, [...this.meals(), { ...meal, id }])
    return id
  }
  async updateMeal(meal: MealEntry): Promise<void> {
    save(KEYS.meals, this.meals().map((m) => (m.id === meal.id ? meal : m)))
  }
  async deleteMeal(id: string): Promise<void> {
    save(KEYS.meals, this.meals().filter((m) => m.id !== id))
  }

  // ── Custom Products ────────────────────────────────────────────────────────

  async getCustomProducts(): Promise<FoodProduct[]> {
    return this.customProducts()
  }
  async addCustomProduct(product: Omit<FoodProduct, 'id' | 'source'>): Promise<string> {
    const id = `custom:${generateId()}`
    const full: FoodProduct = { ...product, id, source: 'custom' }
    save(KEYS.customProducts, [...this.customProducts(), full])
    return id
  }
  async updateCustomProduct(product: FoodProduct): Promise<void> {
    save(KEYS.customProducts, this.customProducts().map((p) => (p.id === product.id ? product : p)))
  }
  async deleteCustomProduct(id: string): Promise<void> {
    save(KEYS.customProducts, this.customProducts().filter((p) => p.id !== id))
  }

  // ── Meal Templates ─────────────────────────────────────────────────────────

  async getMealTemplates(mealType?: MealType): Promise<MealTemplate[]> {
    const all = this.mealTemplates()
    return mealType ? all.filter((t) => t.mealType === mealType) : all
  }
  async saveMealTemplate(template: Omit<MealTemplate, 'id'>): Promise<string> {
    const id = generateId()
    save(KEYS.mealTemplates, [...this.mealTemplates(), { ...template, id }])
    return id
  }
  async incrementTemplateUse(id: string): Promise<void> {
    save(
      KEYS.mealTemplates,
      this.mealTemplates().map((t) =>
        t.id === id
          ? { ...t, useCount: (t.useCount ?? 0) + 1, lastUsed: new Date().toISOString() }
          : t
      )
    )
  }
  async deleteMealTemplate(id: string): Promise<void> {
    save(KEYS.mealTemplates, this.mealTemplates().filter((t) => t.id !== id))
  }

  // ── Recent Products ────────────────────────────────────────────────────────

  async getRecentProducts(): Promise<FoodProduct[]> {
    return this.recentProducts().slice(0, 50)
  }
  async upsertRecentProduct(product: FoodProduct): Promise<void> {
    const existing = this.recentProducts().filter((p) => p.id !== product.id)
    const updated = [{ ...product, lastUsed: new Date().toISOString() }, ...existing].slice(0, 100)
    save(KEYS.recentProducts, updated)
  }

  // ── Weight ─────────────────────────────────────────────────────────────────

  async getWeightEntries(from?: string, to?: string): Promise<WeightEntry[]> {
    let all = this.weights().sort((a, b) => a.date.localeCompare(b.date))
    if (from) all = all.filter((w) => w.date >= from)
    if (to) all = all.filter((w) => w.date <= to)
    return all
  }
  async upsertWeightEntry(entry: Omit<WeightEntry, 'id'>): Promise<void> {
    const id = entry.date
    const existing = this.weights().filter((w) => w.id !== id)
    save(KEYS.weights, [...existing, { ...entry, id }])
  }
  async deleteWeightEntry(id: string): Promise<void> {
    save(KEYS.weights, this.weights().filter((w) => w.id !== id))
  }

  // ── Blood Pressure ─────────────────────────────────────────────────────────

  async getBloodPressureEntries(from?: string, to?: string): Promise<BloodPressureEntry[]> {
    let all = this.bloodPressure().sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    if (from) all = all.filter((e) => e.date >= from)
    if (to) all = all.filter((e) => e.date <= to)
    return all
  }
  async addBloodPressureEntry(entry: Omit<BloodPressureEntry, 'id' | 'category'>): Promise<string> {
    const id = generateId()
    const category = classifyBP(entry.systolic, entry.diastolic)
    save(KEYS.bloodPressure, [...this.bloodPressure(), { ...entry, id, category }])
    return id
  }
  async updateBloodPressureEntry(entry: BloodPressureEntry): Promise<void> {
    const category = classifyBP(entry.systolic, entry.diastolic)
    save(
      KEYS.bloodPressure,
      this.bloodPressure().map((e) => (e.id === entry.id ? { ...entry, category } : e))
    )
  }
  async deleteBloodPressureEntry(id: string): Promise<void> {
    save(KEYS.bloodPressure, this.bloodPressure().filter((e) => e.id !== id))
  }

  // ── Export / Import / Clear ────────────────────────────────────────────────

  async exportAll(): Promise<string> {
    return JSON.stringify({
      steps: this.steps(),
      activities: this.activities(),
      hydration: this.hydration(),
      settings: await this.getSettings(),
      meals: this.meals(),
      customProducts: this.customProducts(),
      weights: this.weights(),
      bloodPressure: this.bloodPressure(),
      exportedAt: new Date().toISOString(),
    }, null, 2)
  }

  async importAll(data: string): Promise<void> {
    const parsed = JSON.parse(data)
    if (parsed.steps) save(KEYS.steps, parsed.steps)
    if (parsed.activities) save(KEYS.activities, parsed.activities)
    if (parsed.hydration) save(KEYS.hydration, parsed.hydration)
    if (parsed.settings) save(KEYS.settings, parsed.settings)
    if (parsed.meals) save(KEYS.meals, parsed.meals)
    if (parsed.customProducts) save(KEYS.customProducts, parsed.customProducts)
    if (parsed.weights) save(KEYS.weights, parsed.weights)
    if (parsed.bloodPressure) save(KEYS.bloodPressure, parsed.bloodPressure)
  }

  async clearAll(): Promise<void> {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  }
}

export const repository = new LocalStorageRepository()
