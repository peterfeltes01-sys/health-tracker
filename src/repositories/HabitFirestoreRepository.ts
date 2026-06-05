import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { HabitRepository } from './HabitRepository'
import type { Habit, HabitEntry } from '../types/habits'
import { generateId } from '../utils/calculations'

export class HabitFirestoreRepository implements HabitRepository {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  private col(name: string) {
    return collection(db, 'users', this.userId, name)
  }

  private mapDocs<T>(snap: { docs: { id: string; data(): object }[] }): T[] {
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T))
  }

  async getHabits(): Promise<Habit[]> {
    const snap = await getDocs(query(this.col('habits'), orderBy('order', 'asc')))
    return this.mapDocs<Habit>(snap)
  }

  async addHabit(habit: Omit<Habit, 'id'>): Promise<string> {
    const id = generateId()
    await setDoc(doc(this.col('habits'), id), { ...habit, id, _ts: Timestamp.now() })
    return id
  }

  async updateHabit(habit: Habit): Promise<void> {
    const { id, ...data } = habit
    await updateDoc(doc(this.col('habits'), id), { ...data, _ts: Timestamp.now() })
  }

  async getEntriesByDate(date: string): Promise<HabitEntry[]> {
    const snap = await getDocs(
      query(this.col('habitEntries'), where('date', '==', date))
    )
    return this.mapDocs<HabitEntry>(snap)
  }

  async getEntriesByDateRange(from: string, to: string): Promise<HabitEntry[]> {
    const snap = await getDocs(
      query(this.col('habitEntries'), where('date', '>=', from), where('date', '<=', to))
    )
    return this.mapDocs<HabitEntry>(snap)
  }

  async upsertEntry(entry: HabitEntry): Promise<void> {
    const { id, ...data } = entry
    await setDoc(doc(this.col('habitEntries'), id), { ...data, id, _ts: Timestamp.now() })
  }

  async deleteEntry(id: string): Promise<void> {
    await deleteDoc(doc(this.col('habitEntries'), id))
  }
}
