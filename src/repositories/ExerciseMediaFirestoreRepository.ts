import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { ExerciseMediaRepository } from './ExerciseMediaRepository'
import type { ExerciseMediaSettings } from '../types/routine'

export class ExerciseMediaFirestoreRepository implements ExerciseMediaRepository {
  private uid: string
  constructor(uid: string) {
    this.uid = uid
  }

  private col() {
    return collection(db, 'users', this.uid, 'exerciseMediaSettings')
  }

  async getOverride(exerciseId: string): Promise<ExerciseMediaSettings | null> {
    const snap = await getDoc(doc(this.col(), exerciseId))
    if (!snap.exists()) return null
    return snap.data() as ExerciseMediaSettings
  }

  async upsertOverride(override: ExerciseMediaSettings): Promise<void> {
    await setDoc(doc(this.col(), override.exerciseId), {
      ...override,
      _ts: Timestamp.now(),
    })
  }

  async deleteOverride(exerciseId: string): Promise<void> {
    await deleteDoc(doc(this.col(), exerciseId))
  }
}
