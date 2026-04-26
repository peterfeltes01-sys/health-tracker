import { ProgressRing } from './ProgressRing'
import { formatSteps, formatHydration, formatCalories, formatDuration } from '../../utils/formatters'
import type { Activity } from '../../types'

interface DailyOverviewProps {
  steps: number
  stepGoal: number
  hydration: number
  hydrationGoal: number
  activities: Activity[]
}

export function DailyOverview({ steps, stepGoal, hydration, hydrationGoal, activities }: DailyOverviewProps) {
  const totalCals = activities.reduce((s, a) => s + (a.calories ?? 0), 0)
  const totalMins = activities.reduce((s, a) => s + a.durationMinutes, 0)
  const stepsPercent = Math.min(100, Math.round((steps / stepGoal) * 100))
  const hydPercent = Math.min(100, Math.round((hydration / hydrationGoal) * 100))

  const allGoalsDone = stepsPercent >= 100 && hydPercent >= 100

  return (
    <div className="space-y-4">
      {allGoalsDone && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-4 text-white flex items-center gap-3">
          <span className="text-3xl">🏆</span>
          <div>
            <div className="font-bold">Tagesziele erreicht!</div>
            <div className="text-sm text-primary-100">Fantastische Leistung heute!</div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-around">
          <ProgressRing
            value={steps}
            max={stepGoal}
            size={110}
            strokeWidth={9}
            color="white"
            label={stepsPercent >= 100 ? '✓' : `${stepsPercent}%`}
            sublabel="Schritte"
            icon="🦶"
          />
          <div className="text-center">
            <div className="text-4xl font-bold">{formatSteps(steps)}</div>
            <div className="text-primary-200 text-sm mt-1">von {formatSteps(stepGoal)}</div>
            <div className="mt-3 space-y-1">
              <div className="bg-white/20 rounded-lg px-3 py-1.5 text-sm">
                🔥 {formatCalories(totalCals)}
              </div>
              <div className="bg-white/20 rounded-lg px-3 py-1.5 text-sm">
                ⏱️ {totalMins > 0 ? formatDuration(totalMins) : '—'}
              </div>
            </div>
          </div>
          <ProgressRing
            value={hydration}
            max={hydrationGoal}
            size={110}
            strokeWidth={9}
            color="white"
            label={hydPercent >= 100 ? '✓' : `${hydPercent}%`}
            sublabel="Wasser"
            icon="💧"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{activities.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Aktivitäten</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatHydration(hydration)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Getrunken</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
          <div className="text-2xl font-bold text-accent-500">{totalCals > 0 ? Math.round(totalCals) : '—'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">kcal</div>
        </div>
      </div>
    </div>
  )
}
