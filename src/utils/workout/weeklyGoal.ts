import { format, startOfWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import type { WeeklyGoal, WorkoutSession } from '../../types/workout'
import { DEFAULT_WEEKLY_TARGET_DAYS, DEFAULT_WEEKLY_TARGET_POINTS } from '../../types/workout'

export function getWeekId(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const weekStart = startOfWeek(d, { weekStartsOn: 1 })
  return format(weekStart, "RRRR-'W'II", { locale: de })
}

export function buildEmptyWeeklyGoal(
  weekId: string,
  targetDays: number = DEFAULT_WEEKLY_TARGET_DAYS,
  targetPoints: number = DEFAULT_WEEKLY_TARGET_POINTS
): WeeklyGoal {
  return {
    weekId,
    targetDays,
    targetPoints,
    trainedDays: 0,
    earnedPoints: 0,
    achieved: false,
    achievedAt: null,
  }
}

export function applySessionToWeeklyGoal(
  goal: WeeklyGoal,
  session: Pick<WorkoutSession, 'totalPoints' | 'date'>,
  previousSessionsThisWeek: Pick<WorkoutSession, 'date'>[]
): WeeklyGoal {
  const alreadyCountedToday = previousSessionsThisWeek.some((s) => s.date === session.date)
  const trainedDays = alreadyCountedToday ? goal.trainedDays : goal.trainedDays + 1
  const earnedPoints = goal.earnedPoints + session.totalPoints

  const achieved =
    !goal.achieved && trainedDays >= goal.targetDays && earnedPoints >= goal.targetPoints

  return {
    ...goal,
    trainedDays,
    earnedPoints,
    achieved: goal.achieved || achieved,
    achievedAt: achieved ? Date.now() : goal.achievedAt,
  }
}

export function weeklyGoalBonus(targetPoints: number): number {
  return Math.round(targetPoints * 0.2)
}
