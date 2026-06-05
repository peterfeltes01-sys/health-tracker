import type { WorkoutSession, WorkoutStats, WeeklyGoal, Achievement } from '../types/workout'

export interface WorkoutRepository {
  addSession(session: Omit<WorkoutSession, 'id'>): Promise<string>
  getSessions(range: { from: string; to: string }): Promise<WorkoutSession[]>
  getSessionByDate(date: string): Promise<WorkoutSession | null>

  getStats(): Promise<WorkoutStats>
  updateStats(stats: WorkoutStats): Promise<void>

  getWeeklyGoal(weekId: string): Promise<WeeklyGoal | null>
  upsertWeeklyGoal(goal: WeeklyGoal): Promise<void>
  getAllWeeklyGoals(): Promise<WeeklyGoal[]>

  getAchievements(): Promise<Achievement[]>
  addAchievement(a: Achievement): Promise<void>

  finishSessionAtomic(params: {
    session: Omit<WorkoutSession, 'id'>
    stats: WorkoutStats
    weeklyGoal: WeeklyGoal
    newAchievements: Achievement[]
  }): Promise<string>
}
