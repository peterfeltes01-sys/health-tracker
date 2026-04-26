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
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { DataRepository } from './DataRepository'
import type { StepEntry, Activity, HydrationEntry, UserSettings } from '../types'
import { DEFAULT_SETTINGS } from '../utils/constants'

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

  async exportAll(): Promise<string> {
    const FAR_FUTURE = '2099-12-31'
    const FAR_PAST = '2000-01-01'
    const [steps, activities, hydration, settings] = await Promise.all([
      this.getStepsByDateRange(FAR_PAST, FAR_FUTURE),
      this.getActivitiesByDateRange(FAR_PAST, FAR_FUTURE),
      this.getHydrationByDateRange(FAR_PAST, FAR_FUTURE),
      this.getSettings(),
    ])
    return JSON.stringify(
      { steps, activities, hydration, settings, exportedAt: new Date().toISOString() },
      null,
      2
    )
  }

  async importAll(data: string): Promise<void> {
    const parsed = JSON.parse(data)
    const batch = writeBatch(db)

    if (Array.isArray(parsed.steps)) {
      for (const entry of parsed.steps) {
        const { id, ...rest } = entry
        batch.set(doc(this.col('steps'), id), rest)
      }
    }
    if (Array.isArray(parsed.activities)) {
      for (const entry of parsed.activities) {
        const { id, ...rest } = entry
        batch.set(doc(this.col('activities'), id), rest)
      }
    }
    if (Array.isArray(parsed.hydration)) {
      for (const entry of parsed.hydration) {
        const { id, ...rest } = entry
        batch.set(doc(this.col('hydration'), id), rest)
      }
    }
    if (parsed.settings) {
      batch.set(this.userDoc(), { settings: parsed.settings }, { merge: true })
    }
    await batch.commit()
  }

  async clearAll(): Promise<void> {
    const cols = ['steps', 'activities', 'hydration'] as const
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
