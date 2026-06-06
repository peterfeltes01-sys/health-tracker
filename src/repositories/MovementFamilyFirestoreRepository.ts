import { collection, doc, getDocs, setDoc, deleteDoc, query, where, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { MovementFamilyRepository } from './MovementFamilyRepository'
import type { MovementFamily } from '../types/training'
import { SEED_MOVEMENT_FAMILIES } from '../data/movementFamilies'

export class MovementFamilyFirestoreRepository implements MovementFamilyRepository {
  private uid: string
  constructor(uid: string) {
    this.uid = uid
  }

  private col() {
    return collection(db, 'users', this.uid, 'movementFamilies')
  }

  async getAll(): Promise<MovementFamily[]> {
    const snap = await getDocs(this.col())
    if (snap.empty) return SEED_MOVEMENT_FAMILIES
    return snap.docs.map((d) => ({ ...d.data() } as MovementFamily))
  }

  async getById(id: string): Promise<MovementFamily | null> {
    const all = await this.getAll()
    return all.find((f) => f.id === id) ?? null
  }

  async getByExerciseId(exerciseId: string): Promise<MovementFamily | null> {
    const snap = await getDocs(
      query(this.col(), where('levels', 'array-contains', exerciseId), limit(1))
    )
    if (snap.empty) return null
    return snap.docs[0].data() as MovementFamily
  }

  async upsert(family: MovementFamily): Promise<void> {
    await setDoc(doc(this.col(), family.id), family)
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.col(), id))
  }
}
