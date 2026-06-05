import type { WorkoutRepository } from './WorkoutRepository'
import type { WorkoutSession, WorkoutStats, WeeklyGoal, Achievement } from '../types/workout'
import { DEFAULT_WORKOUT_STATS } from '../types/workout'
import { generateId } from '../utils/calculations'

const KEYS = {
  sessions: 'ht_workout_sessions',
  stats: 'ht_workout_stats',
  weeklyGoals: 'ht_workout_weekly_goals',
  achievements: 'ht_workout_achievements',
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

export class WorkoutLocalStorageRepository implements WorkoutRepository {
  private sessions(): WorkoutSession[] { return load<WorkoutSession[]>(KEYS.sessions, []) }
  private goals(): WeeklyGoal[] { return load<WeeklyGoal[]>(KEYS.weeklyGoals, []) }
  private achievements_(): Achievement[] { return load<Achievement[]>(KEYS.achievements, []) }

  async addSession(session: Omit<WorkoutSession, 'id'>): Promise<string> {
    const id = generateId()
    save(KEYS.sessions, [...this.sessions(), { ...session, id }])
    return id
  }

  async getSessions(range: { from: string; to: string }): Promise<WorkoutSession[]> {
    return this.sessions()
      .filter((s) => s.date >= range.from && s.date <= range.to)
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  async getSessionByDate(date: string): Promise<WorkoutSession | null> {
    return this.sessions().find((s) => s.date === date) ?? null
  }

  async getStats(): Promise<WorkoutStats> {
    return load<WorkoutStats>(KEYS.stats, { ...DEFAULT_WORKOUT_STATS })
  }

  async updateStats(stats: WorkoutStats): Promise<void> {
    save(KEYS.stats, stats)
  }

  async getWeeklyGoal(weekId: string): Promise<WeeklyGoal | null> {
    return this.goals().find((g) => g.weekId === weekId) ?? null
  }

  async upsertWeeklyGoal(goal: WeeklyGoal): Promise<void> {
    const existing = this.goals().filter((g) => g.weekId !== goal.weekId)
    save(KEYS.weeklyGoals, [...existing, goal])
  }

  async getAllWeeklyGoals(): Promise<WeeklyGoal[]> {
    return this.goals().sort((a, b) => a.weekId.localeCompare(b.weekId))
  }

  async getAchievements(): Promise<Achievement[]> {
    return this.achievements_()
  }

  async addAchievement(a: Achievement): Promise<void> {
    const existing = this.achievements_().filter((x) => x.id !== a.id)
    save(KEYS.achievements, [...existing, a])
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
    const id = generateId()
    save(KEYS.sessions, [...this.sessions(), { ...session, id }])
    save(KEYS.stats, stats)
    const existingGoals = this.goals().filter((g) => g.weekId !== weeklyGoal.weekId)
    save(KEYS.weeklyGoals, [...existingGoals, weeklyGoal])
    const existingAchievements = this.achievements_()
    const newIds = new Set(newAchievements.map((a) => a.id))
    save(KEYS.achievements, [
      ...existingAchievements.filter((a) => !newIds.has(a.id)),
      ...newAchievements,
    ])
    return id
  }
}
