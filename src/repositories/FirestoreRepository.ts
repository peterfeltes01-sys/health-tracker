import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  setDoc,
  getDoc,
  writeBatch,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { DataRepository } from './DataRepository'
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
import { DEFAULT_SETTINGS } from '../utils/constants'
import { generateId } from '../utils/calculations'
import { classifyBP } from '../lib/bloodPressure'

export class FirestoreRepository implements DataRepository {
  private userId: string
  constructor(userId: string) {
    this.userId = userId
  }

  private col(name: string) {
    return collection(db, 'users', this.userId, name)
  }

  private userDoc() {
    return doc(db, 'users', this.userId)
  }

  private mapDocs<T>(snap: { docs: { id: string; data(): object }[] }): T[] {
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T))
  }

  // ── Steps ──────────────────────────────────────────────────────────────────

  async getStepsByDate(date: string): Promise<StepEntry[]> {
    const snap = await getDocs(query(this.col('steps'), where('date', '==', date)))
    return this.mapDocs<StepEntry>(snap)
  }

  async getStepsByDateRange(from: string, to: string): Promise<StepEntry[]> {
    const snap = await getDocs(
      query(this.col('steps'), where('date', '>=', from), where('date', '<=', to))
    )
    return this.mapDocs<StepEntry>(snap)
  }

  async addSteps(entry: StepEntry): Promise<void> {
    const { id, ...data } = entry
    await setDoc(doc(this.col('steps'), id), { ...data, _ts: Timestamp.now() })
  }

  async deleteSteps(id: string): Promise<void> {
    await deleteDoc(doc(this.col('steps'), id))
  }

  // ── Activities ─────────────────────────────────────────────────────────────

  async getActivitiesByDate(date: string): Promise<Activity[]> {
    const snap = await getDocs(query(this.col('activities'), where('date', '==', date)))
    return this.mapDocs<Activity>(snap)
  }

  async getActivitiesByDateRange(from: string, to: string): Promise<Activity[]> {
    const snap = await getDocs(
      query(this.col('activities'), where('date', '>=', from), where('date', '<=', to))
    )
    return this.mapDocs<Activity>(snap)
  }

  async addActivity(activity: Activity): Promise<void> {
    const { id, ...data } = activity
    await setDoc(doc(this.col('activities'), id), { ...data, _ts: Timestamp.now() })
  }

  async updateActivity(activity: Activity): Promise<void> {
    const { id, ...data } = activity
    await updateDoc(doc(this.col('activities'), id), { ...data, _ts: Timestamp.now() })
  }

  async deleteActivity(id: string): Promise<void> {
    await deleteDoc(doc(this.col('activities'), id))
  }

  // ── Hydration ──────────────────────────────────────────────────────────────

  async getHydrationByDate(date: string): Promise<HydrationEntry[]> {
    const snap = await getDocs(query(this.col('hydration'), where('date', '==', date)))
    return this.mapDocs<HydrationEntry>(snap)
  }

  async getHydrationByDateRange(from: string, to: string): Promise<HydrationEntry[]> {
    const snap = await getDocs(
      query(this.col('hydration'), where('date', '>=', from), where('date', '<=', to))
    )
    return this.mapDocs<HydrationEntry>(snap)
  }

  async addHydration(entry: HydrationEntry): Promise<void> {
    const { id, ...data } = entry
    await setDoc(doc(this.col('hydration'), id), { ...data, _ts: Timestamp.now() })
  }

  async deleteHydration(id: string): Promise<void> {
    await deleteDoc(doc(this.col('hydration'), id))
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  async getSettings(): Promise<UserSettings> {
    const snap = await getDoc(this.userDoc())
    if (snap.exists()) {
      const data = snap.data()
      return { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) } as UserSettings
    }
    await setDoc(this.userDoc(), { settings: DEFAULT_SETTINGS }, { merge: true })
    return { ...DEFAULT_SETTINGS }
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    const current = await this.getSettings()
    await setDoc(
      this.userDoc(),
      { settings: { ...current, ...settings } },
      { merge: true }
    )
  }

  // ── Nutrition / Meals ──────────────────────────────────────────────────────

  async getMealsByDate(date: string): Promise<MealEntry[]> {
    const snap = await getDocs(query(this.col('meals'), where('date', '==', date)))
    return this.mapDocs<MealEntry>(snap)
  }

  async getMealsByDateRange(from: string, to: string): Promise<MealEntry[]> {
    const snap = await getDocs(
      query(this.col('meals'), where('date', '>=', from), where('date', '<=', to))
    )
    return this.mapDocs<MealEntry>(snap)
  }

  async addMeal(meal: Omit<MealEntry, 'id'>): Promise<string> {
    const id = generateId()
    await setDoc(doc(this.col('meals'), id), { ...meal, id, _ts: Timestamp.now() })
    return id
  }

  async updateMeal(meal: MealEntry): Promise<void> {
    const { id, ...data } = meal
    await updateDoc(doc(this.col('meals'), id), { ...data, _ts: Timestamp.now() })
  }

  async deleteMeal(id: string): Promise<void> {
    await deleteDoc(doc(this.col('meals'), id))
  }

  // ── Custom Products ────────────────────────────────────────────────────────

  async getCustomProducts(): Promise<FoodProduct[]> {
    const snap = await getDocs(this.col('customProducts'))
    return this.mapDocs<FoodProduct>(snap)
  }

  async addCustomProduct(product: Omit<FoodProduct, 'id' | 'source'>): Promise<string> {
    const id = `custom:${generateId()}`
    const full: FoodProduct = { ...product, id, source: 'custom' }
    await setDoc(doc(this.col('customProducts'), id), { ...full, _ts: Timestamp.now() })
    return id
  }

  async updateCustomProduct(product: FoodProduct): Promise<void> {
    const { id, ...data } = product
    await updateDoc(doc(this.col('customProducts'), id), { ...data, _ts: Timestamp.now() })
  }

  async deleteCustomProduct(id: string): Promise<void> {
    await deleteDoc(doc(this.col('customProducts'), id))
  }

  // ── Meal Templates ─────────────────────────────────────────────────────────

  async getMealTemplates(mealType?: MealType): Promise<MealTemplate[]> {
    const q = mealType
      ? query(this.col('mealTemplates'), where('mealType', '==', mealType))
      : this.col('mealTemplates')
    const snap = await getDocs(q)
    return this.mapDocs<MealTemplate>(snap)
  }

  async saveMealTemplate(template: Omit<MealTemplate, 'id'>): Promise<string> {
    const id = generateId()
    await setDoc(doc(this.col('mealTemplates'), id), { ...template, id, _ts: Timestamp.now() })
    return id
  }

  async incrementTemplateUse(id: string): Promise<void> {
    const ref = doc(this.col('mealTemplates'), id)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    const data = snap.data() as MealTemplate
    await updateDoc(ref, {
      useCount: (data.useCount ?? 0) + 1,
      lastUsed: new Date().toISOString(),
    })
  }

  async deleteMealTemplate(id: string): Promise<void> {
    await deleteDoc(doc(this.col('mealTemplates'), id))
  }

  // ── Recent Products (OFF Cache) ────────────────────────────────────────────

  async getRecentProducts(): Promise<FoodProduct[]> {
    const snap = await getDocs(
      query(this.col('recentProducts'), orderBy('lastUsed', 'desc'), limit(50))
    )
    return this.mapDocs<FoodProduct>(snap)
  }

  async upsertRecentProduct(product: FoodProduct): Promise<void> {
    await setDoc(doc(this.col('recentProducts'), product.id), {
      ...product,
      lastUsed: new Date().toISOString(),
    })
    // LRU cleanup: keep max 100
    const all = await getDocs(
      query(this.col('recentProducts'), orderBy('lastUsed', 'desc'))
    )
    if (all.docs.length > 100) {
      const batch = writeBatch(db)
      all.docs.slice(100).forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
  }

  // ── Weight ─────────────────────────────────────────────────────────────────

  async getWeightEntries(from?: string, to?: string): Promise<WeightEntry[]> {
    let q = query(this.col('weights'), orderBy('date', 'asc'))
    if (from && to) {
      q = query(this.col('weights'), where('date', '>=', from), where('date', '<=', to), orderBy('date', 'asc'))
    } else if (from) {
      q = query(this.col('weights'), where('date', '>=', from), orderBy('date', 'asc'))
    }
    const snap = await getDocs(q)
    return this.mapDocs<WeightEntry>(snap)
  }

  async upsertWeightEntry(entry: Omit<WeightEntry, 'id'>): Promise<void> {
    const id = entry.date
    await setDoc(doc(this.col('weights'), id), { ...entry, id, _ts: Timestamp.now() })
  }

  async deleteWeightEntry(id: string): Promise<void> {
    await deleteDoc(doc(this.col('weights'), id))
  }

  // ── Blood Pressure ─────────────────────────────────────────────────────────

  async getBloodPressureEntries(from?: string, to?: string): Promise<BloodPressureEntry[]> {
    let q = query(this.col('bloodPressure'), orderBy('date', 'asc'))
    if (from && to) {
      q = query(this.col('bloodPressure'), where('date', '>=', from), where('date', '<=', to), orderBy('date', 'asc'))
    } else if (from) {
      q = query(this.col('bloodPressure'), where('date', '>=', from), orderBy('date', 'asc'))
    }
    const snap = await getDocs(q)
    return this.mapDocs<BloodPressureEntry>(snap)
  }

  async addBloodPressureEntry(entry: Omit<BloodPressureEntry, 'id' | 'category'>): Promise<string> {
    const id = generateId()
    const category = classifyBP(entry.systolic, entry.diastolic)
    await setDoc(doc(this.col('bloodPressure'), id), {
      ...entry,
      id,
      category,
      _ts: Timestamp.now(),
    })
    return id
  }

  async updateBloodPressureEntry(entry: BloodPressureEntry): Promise<void> {
    const { id, ...data } = entry
    const category = classifyBP(entry.systolic, entry.diastolic)
    await updateDoc(doc(this.col('bloodPressure'), id), { ...data, category, _ts: Timestamp.now() })
  }

  async deleteBloodPressureEntry(id: string): Promise<void> {
    await deleteDoc(doc(this.col('bloodPressure'), id))
  }

  // ── Export / Import / Clear ────────────────────────────────────────────────

  async exportAll(): Promise<string> {
    const FAR_FUTURE = '2099-12-31'
    const FAR_PAST = '2000-01-01'
    const [steps, activities, hydration, settings, meals, customProducts, weights, bloodPressure] =
      await Promise.all([
        this.getStepsByDateRange(FAR_PAST, FAR_FUTURE),
        this.getActivitiesByDateRange(FAR_PAST, FAR_FUTURE),
        this.getHydrationByDateRange(FAR_PAST, FAR_FUTURE),
        this.getSettings(),
        this.getMealsByDateRange(FAR_PAST, FAR_FUTURE),
        this.getCustomProducts(),
        this.getWeightEntries(),
        this.getBloodPressureEntries(),
      ])
    return JSON.stringify(
      { steps, activities, hydration, settings, meals, customProducts, weights, bloodPressure, exportedAt: new Date().toISOString() },
      null,
      2
    )
  }

  async importAll(data: string): Promise<void> {
    const parsed = JSON.parse(data)
    const batch = writeBatch(db)

    const addToBatch = (colName: string, entries: { id: string }[]) => {
      for (const entry of entries) {
        const { id, ...rest } = entry
        batch.set(doc(this.col(colName), id), rest)
      }
    }

    if (Array.isArray(parsed.steps)) addToBatch('steps', parsed.steps)
    if (Array.isArray(parsed.activities)) addToBatch('activities', parsed.activities)
    if (Array.isArray(parsed.hydration)) addToBatch('hydration', parsed.hydration)
    if (Array.isArray(parsed.meals)) addToBatch('meals', parsed.meals)
    if (Array.isArray(parsed.customProducts)) addToBatch('customProducts', parsed.customProducts)
    if (Array.isArray(parsed.weights)) addToBatch('weights', parsed.weights)
    if (Array.isArray(parsed.bloodPressure)) addToBatch('bloodPressure', parsed.bloodPressure)
    if (parsed.settings) {
      batch.set(this.userDoc(), { settings: parsed.settings }, { merge: true })
    }
    await batch.commit()
  }

  async clearAll(): Promise<void> {
    const cols = ['steps', 'activities', 'hydration', 'meals', 'customProducts', 'mealTemplates', 'recentProducts', 'weights', 'bloodPressure'] as const
    for (const colName of cols) {
      const snap = await getDocs(this.col(colName))
      if (snap.docs.length === 0) continue
      const batch = writeBatch(db)
      snap.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
    await setDoc(this.userDoc(), { settings: DEFAULT_SETTINGS })
  }
}
