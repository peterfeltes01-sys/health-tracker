import {
  collection,
  doc,
  getDocs,
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
import type { WorkoutRepository } from './WorkoutRepository'
import type {
  WorkoutSession,
  WorkoutStats,
  WeeklyGoal,
  Achievement,
  ExerciseMediaOverride,
  CustomExercise,
} from '../types/workout'
import { DEFAULT_WORKOUT_STATS } from '../types/workout'
import { generateId } from '../utils/calculations'

export class WorkoutFirestoreRepository implements WorkoutRepository {
  private uid: string
  constructor(uid: string) {
    this.uid = uid
  }

  private col(name: string) {
    return collection(db, 'users', this.uid, name)
  }

  private mapDocs<T>(snap: { docs: { id: string; data(): object }[] }): T[] {
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T))
  }

  async addSession(session: Omit<WorkoutSession, 'id'>): Promise<string> {
    const id = generateId()
    await setDoc(doc(this.col('workoutSessions'), id), { ...session, id, _ts: Timestamp.now() })
    return id
  }

  async getSessions(range: { from: string; to: string }): Promise<WorkoutSession[]> {
    const snap = await getDocs(
      query(
        this.col('workoutSessions'),
        where('date', '>=', range.from),
        where('date', '<=', range.to),
        orderBy('date', 'asc')
      )
    )
    return this.mapDocs<WorkoutSession>(snap)
  }

  async getSessionByDate(date: string): Promise<WorkoutSession | null> {
    const snap = await getDocs(
      query(this.col('workoutSessions'), where('date', '==', date), limit(1))
    )
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as WorkoutSession
  }

  async getStats(): Promise<WorkoutStats> {
    const ref = doc(this.col('workoutStats'), 'summary')
    const snap = await getDoc(ref)
    if (snap.exists()) return snap.data() as WorkoutStats
    await setDoc(ref, { ...DEFAULT_WORKOUT_STATS })
    return { ...DEFAULT_WORKOUT_STATS }
  }

  async updateStats(stats: WorkoutStats): Promise<void> {
    await setDoc(doc(this.col('workoutStats'), 'summary'), { ...stats, _ts: Timestamp.now() })
  }

  async getWeeklyGoal(weekId: string): Promise<WeeklyGoal | null> {
    const snap = await getDoc(doc(this.col('weeklyGoals'), weekId))
    if (!snap.exists()) return null
    return snap.data() as WeeklyGoal
  }

  async upsertWeeklyGoal(goal: WeeklyGoal): Promise<void> {
    await setDoc(doc(this.col('weeklyGoals'), goal.weekId), { ...goal, _ts: Timestamp.now() })
  }

  async getAllWeeklyGoals(): Promise<WeeklyGoal[]> {
    const snap = await getDocs(query(this.col('weeklyGoals'), orderBy('weekId', 'asc')))
    return this.mapDocs<WeeklyGoal>(snap)
  }

  async getAchievements(): Promise<Achievement[]> {
    const snap = await getDocs(this.col('workoutAchievements'))
    return this.mapDocs<Achievement>(snap)
  }

  async addAchievement(a: Achievement): Promise<void> {
    await setDoc(doc(this.col('workoutAchievements'), a.id), { ...a, _ts: Timestamp.now() })
  }

  async finishSessionAtomic({
    session,
    stats,
    weeklyGoal,
    newAchievements,
  }: {
    session: Omit<WorkoutSession, 'id'>
    stats: WorkoutStats
    weeklyGoal: WeeklyGoal
    newAchievements: Achievement[]
  }): Promise<string> {
    const sessionId = generateId()
    const batch = writeBatch(db)

    batch.set(doc(this.col('workoutSessions'), sessionId), {
      ...session,
      id: sessionId,
      _ts: Timestamp.now(),
    })
    batch.set(doc(this.col('workoutStats'), 'summary'), { ...stats, _ts: Timestamp.now() })
    batch.set(doc(this.col('weeklyGoals'), weeklyGoal.weekId), {
      ...weeklyGoal,
      _ts: Timestamp.now(),
    })
    for (const a of newAchievements) {
      batch.set(doc(this.col('workoutAchievements'), a.id), { ...a, _ts: Timestamp.now() })
    }

    await batch.commit()
    return sessionId
  }

  // ── Media Overrides ─────────────────────────────────────────────────────────

  async getMediaOverrides(): Promise<ExerciseMediaOverride[]> {
    const snap = await getDocs(this.col('mediaOverrides'))
    return this.mapDocs<ExerciseMediaOverride>(snap)
  }

  async upsertMediaOverride(o: ExerciseMediaOverride): Promise<void> {
    await setDoc(doc(this.col('mediaOverrides'), o.exerciseId), { ...o, _ts: Timestamp.now() })
  }

  async deleteMediaItem(exerciseId: string, storagePath: string): Promise<void> {
    const ref = doc(this.col('mediaOverrides'), exerciseId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    const override = snap.data() as ExerciseMediaOverride
    const filtered = override.customMedia.filter((m) => m.storagePath !== storagePath)
    if (filtered.length === 0) {
      await deleteDoc(ref)
    } else {
      await setDoc(ref, { ...override, customMedia: filtered, updatedAt: Date.now(), _ts: Timestamp.now() })
    }
  }

  // ── Custom Exercises ────────────────────────────────────────────────────────

  async getCustomExercises(): Promise<CustomExercise[]> {
    const snap = await getDocs(query(this.col('customExercises'), orderBy('createdAt', 'asc')))
    return this.mapDocs<CustomExercise>(snap)
  }

  async addCustomExercise(e: Omit<CustomExercise, 'id'>): Promise<string> {
    const id = `custom-${generateId()}`
    await setDoc(doc(this.col('customExercises'), id), { ...e, id, _ts: Timestamp.now() })
    return id
  }

  async updateCustomExercise(e: CustomExercise): Promise<void> {
    const { id, ...data } = e
    await setDoc(doc(this.col('customExercises'), id), { ...data, id, _ts: Timestamp.now() })
  }

  async deleteCustomExercise(id: string): Promise<void> {
    await deleteDoc(doc(this.col('customExercises'), id))
  }
}
