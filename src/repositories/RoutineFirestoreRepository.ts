import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { RoutineRepository } from './RoutineRepository'
import type { Routine } from '../types/routine'
import { generateId } from '../utils/calculations'

export class RoutineFirestoreRepository implements RoutineRepository {
  private uid: string
  constructor(uid: string) {
    this.uid = uid
  }

  private col() {
    return collection(db, 'users', this.uid, 'routines')
  }

  async listRoutines(): Promise<Routine[]> {
    const snap = await getDocs(query(this.col(), orderBy('createdAt', 'asc')))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Routine))
  }

  async getRoutine(id: string): Promise<Routine | null> {
    const snap = await getDoc(doc(this.col(), id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as Routine
  }

  async createRoutine(data: Omit<Routine, 'id'>): Promise<Routine> {
    const id = generateId()
    const routine: Routine = { ...data, id }
    await setDoc(doc(this.col(), id), { ...routine, _ts: Timestamp.now() })
    return routine
  }

  async updateRoutine(id: string, patch: Partial<Omit<Routine, 'id'>>): Promise<void> {
    await setDoc(
      doc(this.col(), id),
      { ...patch, updatedAt: Date.now(), _ts: Timestamp.now() },
      { merge: true }
    )
  }

  async deleteRoutine(id: string): Promise<void> {
    await deleteDoc(doc(this.col(), id))
  }
}
