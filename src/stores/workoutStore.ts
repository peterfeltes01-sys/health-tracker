import { create } from 'zustand'
import { format } from 'date-fns'
import type {
  Exercise,
  ExerciseMode,
  PerformedExercise,
  ActiveSession,
  WorkoutSession,
  WorkoutStats,
  WeeklyGoal,
  Achievement,
} from '../types/workout'
import { DEFAULT_WORKOUT_STATS, DEFAULT_WEEKLY_TARGET_DAYS, DEFAULT_WEEKLY_TARGET_POINTS } from '../types/workout'
import { getWorkoutRepository } from '../lib/workoutRepositoryRegistry'
import { buildTodayRoutine } from '../utils/workout/routineBuilder'
import { sessionTotals, sessionTargetPoints, applyBalanceToCover } from '../utils/workout/scoring'
import { getWeekId, buildEmptyWeeklyGoal, applySessionToWeeklyGoal, weeklyGoalBonus } from '../utils/workout/weeklyGoal'
import { evaluateAchievements } from '../utils/workout/achievements'
import { toISODate } from '../utils/calculations'

interface WorkoutStoreState {
  todayRoutine: Exercise[]
  todaySession: WorkoutSession | null
  stats: WorkoutStats
  currentWeekGoal: WeeklyGoal | null
  achievements: Achievement[]
  activeSession: ActiveSession | null
  preferredMode: ExerciseMode
  targetDays: number
  targetPoints: number
  recentSessions: WorkoutSession[]
  weeklyHistory: WeeklyGoal[]
  loading: boolean
  error: string | null

  load(uid: string): Promise<void>
  buildRoutine(mode?: ExerciseMode): void
  startSession(mode?: ExerciseMode): void
  recordExercise(performed: PerformedExercise): void
  finishSession(): Promise<{ newAchievements: Achievement[] }>
  applyBalanceToday(): Promise<void>
  updateGoalSettings(targetDays: number, targetPoints: number, mode?: ExerciseMode): void
  reset(): void
}

export const useWorkoutStore = create<WorkoutStoreState>((set, get) => ({
  todayRoutine: [],
  todaySession: null,
  stats: { ...DEFAULT_WORKOUT_STATS },
  currentWeekGoal: null,
  achievements: [],
  activeSession: null,
  preferredMode: 'bodyweight',
  targetDays: DEFAULT_WEEKLY_TARGET_DAYS,
  targetPoints: DEFAULT_WEEKLY_TARGET_POINTS,
  recentSessions: [],
  weeklyHistory: [],
  loading: false,
  error: null,

  load: async (_uid) => {
    set({ loading: true, error: null })
    try {
      const repo = getWorkoutRepository()
      const today = toISODate(new Date())
      const weekStart = format(new Date(), 'yyyy-MM-01')
      const range = { from: weekStart, to: today }

      const [stats, weekGoal, achievements, recentSessions, weeklyHistory, todaySession] =
        await Promise.all([
          repo.getStats(),
          repo.getWeeklyGoal(getWeekId(new Date())),
          repo.getAchievements(),
          repo.getSessions(range),
          repo.getAllWeeklyGoals(),
          repo.getSessionByDate(today),
        ])

      const mode = (stats as WorkoutStats & { preferredMode?: ExerciseMode }).preferredMode ?? 'bodyweight'
      const targetDays = (stats as WorkoutStats & { targetDays?: number }).targetDays ?? DEFAULT_WEEKLY_TARGET_DAYS
      const targetPoints_ = (stats as WorkoutStats & { targetPoints?: number }).targetPoints ?? DEFAULT_WEEKLY_TARGET_POINTS

      const routine = buildTodayRoutine(mode)
      const currentWeekGoal = weekGoal ?? buildEmptyWeeklyGoal(getWeekId(new Date()), targetDays, targetPoints_)

      set({
        stats,
        currentWeekGoal,
        achievements,
        recentSessions,
        weeklyHistory,
        todaySession,
        todayRoutine: routine,
        preferredMode: mode,
        targetDays,
        targetPoints: targetPoints_,
        loading: false,
      })
    } catch (e) {
      set({ loading: false, error: String(e) })
    }
  },

  buildRoutine: (mode) => {
    const effectiveMode = mode ?? get().preferredMode
    const routine = buildTodayRoutine(effectiveMode)
    set({ todayRoutine: routine, preferredMode: effectiveMode })
  },

  startSession: (mode) => {
    const { todayRoutine, preferredMode } = get()
    const effectiveMode = mode ?? preferredMode
    set({
      activeSession: {
        mode: effectiveMode,
        exercises: todayRoutine,
        currentIndex: 0,
        startedAt: Date.now(),
        performed: [],
      },
    })
  },

  recordExercise: (performed) => {
    const { activeSession } = get()
    if (!activeSession) return
    set({
      activeSession: {
        ...activeSession,
        performed: [...activeSession.performed, performed],
        currentIndex: activeSession.currentIndex + 1,
      },
    })
  },

  finishSession: async () => {
    const { activeSession, stats, currentWeekGoal, todayRoutine, recentSessions, weeklyHistory, achievements, targetDays, targetPoints } = get()
    if (!activeSession) return { newAchievements: [] }

    const now = Date.now()
    const today = toISODate(new Date())
    const durationSeconds = Math.round((now - activeSession.startedAt) / 1000)

    const { totalPoints, bonusPoints } = sessionTotals(activeSession.performed)
    const targetPts = sessionTargetPoints(todayRoutine)

    // Surplus over daily target goes to balance
    const surplus = Math.max(0, totalPoints - targetPts)
    const newBalance = stats.pointBalance + surplus

    // Streak calculation
    const yesterday = toISODate(new Date(Date.now() - 86400000))
    let newStreak = stats.currentStreakDays
    if (stats.lastSessionDate === yesterday) {
      newStreak = stats.currentStreakDays + 1
    } else if (stats.lastSessionDate !== today) {
      newStreak = 1
    }

    const newLongest = Math.max(stats.longestStreakDays, newStreak)
    const newStats: WorkoutStats = {
      totalPoints: stats.totalPoints + totalPoints,
      pointBalance: newBalance,
      currentStreakDays: newStreak,
      longestStreakDays: newLongest,
      totalSessions: stats.totalSessions + 1,
      totalMinutes: stats.totalMinutes + Math.round(durationSeconds / 60),
      lastSessionDate: today,
    }

    const sessionObj: Omit<WorkoutSession, 'id'> = {
      date: today,
      startedAt: activeSession.startedAt,
      completedAt: now,
      durationSeconds,
      mode: activeSession.mode,
      performed: activeSession.performed,
      totalPoints,
      bonusPoints,
    }

    // Weekly goal update
    const weekId = getWeekId(new Date())
    const base = currentWeekGoal ?? buildEmptyWeeklyGoal(weekId, targetDays, targetPoints)
    const prevInWeek = recentSessions.filter((s) => s.date !== today)
    let updatedGoal = applySessionToWeeklyGoal(base, sessionObj, prevInWeek)

    // If weekly goal just achieved: add bonus to balance
    if (updatedGoal.achieved && !base.achieved) {
      const bonus = weeklyGoalBonus(targetPoints)
      newStats.totalPoints += bonus
      newStats.pointBalance += bonus
    }

    // Evaluate new achievements
    const earnedIds = new Set(achievements.map((a) => a.id))
    const newAchievements = evaluateAchievements(newStats, [...weeklyHistory, updatedGoal], earnedIds)

    const repo = getWorkoutRepository()
    const sessionId = await repo.finishSessionAtomic({
      session: sessionObj,
      stats: newStats,
      weeklyGoal: updatedGoal,
      newAchievements,
    })

    const completedSession: WorkoutSession = { ...sessionObj, id: sessionId }

    set({
      activeSession: null,
      todaySession: completedSession,
      stats: newStats,
      currentWeekGoal: updatedGoal,
      achievements: [...achievements, ...newAchievements],
      recentSessions: [...recentSessions.filter((s) => s.date !== today), completedSession],
    })

    return { newAchievements }
  },

  applyBalanceToday: async () => {
    const { todaySession, stats, currentWeekGoal, todayRoutine, targetDays, targetPoints } = get()
    if (!todaySession || stats.pointBalance <= 0) return

    const dailyTarget = sessionTargetPoints(todayRoutine)
    const gap = Math.max(0, dailyTarget - todaySession.totalPoints)
    if (gap <= 0) return

    const { used, remaining } = applyBalanceToCover(gap, stats.pointBalance)
    if (used <= 0) return

    const newStats: WorkoutStats = { ...stats, pointBalance: remaining }
    const weekId = getWeekId(new Date())
    const base = currentWeekGoal ?? buildEmptyWeeklyGoal(weekId, targetDays, targetPoints)
    const updatedGoal: WeeklyGoal = {
      ...base,
      earnedPoints: base.earnedPoints + used,
    }
    if (!updatedGoal.achieved && updatedGoal.trainedDays >= updatedGoal.targetDays && updatedGoal.earnedPoints >= updatedGoal.targetPoints) {
      updatedGoal.achieved = true
      updatedGoal.achievedAt = Date.now()
    }

    const repo = getWorkoutRepository()
    await Promise.all([repo.updateStats(newStats), repo.upsertWeeklyGoal(updatedGoal)])
    set({ stats: newStats, currentWeekGoal: updatedGoal })
  },

  updateGoalSettings: (targetDays, targetPoints, mode) => {
    const effectiveMode = mode ?? get().preferredMode
    const routine = buildTodayRoutine(effectiveMode)
    set({ targetDays, targetPoints, preferredMode: effectiveMode, todayRoutine: routine })
  },

  reset: () =>
    set({
      todayRoutine: [],
      todaySession: null,
      stats: { ...DEFAULT_WORKOUT_STATS },
      currentWeekGoal: null,
      achievements: [],
      activeSession: null,
      recentSessions: [],
      weeklyHistory: [],
      loading: false,
      error: null,
    }),
}))
