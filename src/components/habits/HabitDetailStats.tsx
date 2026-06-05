import { useState } from 'react'
import type { Habit, HabitEntry } from '../../types/habits'
import {
  calcCurrentStreak,
  calcLongestStreak,
  calcCompletionRate,
} from '../../lib/habitStats'

type RateWindow = 7 | 30 | 90 | 'all'

interface HabitDetailStatsProps {
  habit: Habit
  entries: HabitEntry[]
  today: string
}

export function HabitDetailStats({ habit, entries, today }: HabitDetailStatsProps) {
  const [rateWindow, setRateWindow] = useState<RateWindow>(30)

  const currentStreak = calcCurrentStreak(habit, entries, today)
  const longestStreak = calcLongestStreak(habit, entries)
  const rate = calcCompletionRate(habit, entries, today, rateWindow)

  const streakUnit =
    habit.frequency === 'timesPerWeek'
      ? 'Wochen'
      : habit.frequency === 'timesPerMonth'
      ? 'Monate'
      : 'Tage'

  return (
    <div className="space-y-3">
      {/* Streak cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: habit.color }}>
          <p className="text-xs font-semibold opacity-80 mb-1">Aktuelle Streak</p>
          <p className="text-3xl font-bold tabular-nums">{currentStreak}</p>
          <p className="text-xs opacity-80 mt-0.5">{streakUnit}</p>
        </div>

        <div className="rounded-2xl p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Längste Streak
          </p>
          <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">
            {longestStreak}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{streakUnit}</p>
        </div>
      </div>

      {/* Completion rate */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-800 dark:text-white">Erfüllungsrate</p>
          <div className="flex gap-1">
            {([7, 30, 90, 'all'] as RateWindow[]).map((w) => (
              <button
                key={w}
                onClick={() => setRateWindow(w)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  rateWindow === w
                    ? 'text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}
                style={rateWindow === w ? { backgroundColor: habit.color } : undefined}
              >
                {w === 'all' ? '∞' : `${w}T`}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-3">
          <p className="text-4xl font-bold tabular-nums" style={{ color: habit.color }}>
            {rate}%
          </p>
          <div className="flex-1 pb-1">
            <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${rate}%`, backgroundColor: habit.color }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
