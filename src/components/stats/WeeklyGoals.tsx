import type { Activity } from '../../types'
import { Card } from '../shared/Card'

interface WeeklyGoalsProps {
  activities: Activity[]
  actGoal: number
}

function GoalBar({ value, goal, color, label, formattedValue, formattedGoal }: {
  value: number; goal: number; color: string; label: string; formattedValue: string; formattedGoal: string
}) {
  const pct = Math.min(100, Math.round((value / goal) * 100))
  const done = pct >= 100
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className={`font-semibold tabular-nums ${done ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
          {formattedValue} / {formattedGoal}
          {done && ' ✓'}
        </span>
      </div>
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="text-right text-xs text-gray-400">{pct}%</div>
    </div>
  )
}

export function WeeklyGoals({ activities, actGoal }: WeeklyGoalsProps) {
  const totalActs = activities.length

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">🎯 Wochenziele</h3>
      <div className="space-y-4">
        <GoalBar
          value={totalActs}
          goal={actGoal}
          color="#26a469"
          label="🏃 Aktivitäten"
          formattedValue={`${totalActs}`}
          formattedGoal={`${actGoal} Einheiten`}
        />
      </div>
    </Card>
  )
}
