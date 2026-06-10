import { collection, doc, getDocs, setDoc, query, where, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import type { ProgressionDecision } from '../../../types/training'
import type { ProgressionDecisionRepository } from './ProgressionDecisionRepository'
import { generateId } from '../../../utils/calculations'

export class ProgressionDecisionFirestoreRepository implements ProgressionDecisionRepository {
  private uid: string

  constructor(uid: string) {
    this.uid = uid
  }

  private col() {
    return collection(db, 'users', this.uid, 'progressionDecisions')
  }

  async addDecision(decision: Omit<ProgressionDecision, 'id'>): Promise<string> {
    const id = generateId()
    await setDoc(doc(this.col(), id), { ...decision, id, _ts: Timestamp.now() })
    return id
  }

  async getDecisions(exerciseId?: string): Promise<ProgressionDecision[]> {
    const q = exerciseId
      ? query(this.col(), where('exerciseId', '==', exerciseId), orderBy('timestamp', 'asc'))
      : query(this.col(), orderBy('timestamp', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgressionDecision))
  }
}
