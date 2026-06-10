import { collection, doc, getDocs, setDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import type { ReadinessCheckin } from '../../../types/training'
import type { ReadinessRepository } from './ReadinessRepository'
import { generateId } from '../../../utils/calculations'

export class ReadinessFirestoreRepository implements ReadinessRepository {
  private uid: string

  constructor(uid: string) {
    this.uid = uid
  }

  private col() {
    return collection(db, 'users', this.uid, 'readinessCheckins')
  }

  async addCheckin(checkin: Omit<ReadinessCheckin, 'id'>): Promise<string> {
    const id = generateId()
    await setDoc(doc(this.col(), id), { ...checkin, id, _ts: Timestamp.now() })
    return id
  }

  async getCheckins(from: string, to: string): Promise<ReadinessCheckin[]> {
    const snap = await getDocs(
      query(this.col(), where('date', '>=', from), where('date', '<=', to), orderBy('date', 'asc'))
    )
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReadinessCheckin))
  }

  async getLatestCheckin(): Promise<ReadinessCheckin | null> {
    const snap = await getDocs(
      query(this.col(), orderBy('createdAt', 'desc'), limit(1))
    )
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as ReadinessCheckin
  }
}
