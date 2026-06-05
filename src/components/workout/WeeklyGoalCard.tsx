import { Target, Check } from 'lucide-react'
import type { WeeklyGoal } from '../../types/workout'

interface WeeklyGoalCardProps {
  goal: WeeklyGoal
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function WeeklyGoalCard({ goal }: WeeklyGoalCardProps) {
  const dayPct = goal.targetDays > 0 ? Math.min(goal.trainedDays / goal.targetDays, 1) * 100 : 0
  const ptsPct = goal.targetPoints > 0 ? Math.min(goal.earnedPoints / goal.targetPoints, 1) * 100 : 0

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center">
            <Target size={16} className="text-violet-500" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm">Wochenziel</span>
        </div>
        {goal.achieved && (
          <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
            <Check size={14} />
            Erreicht!
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500 dark:text-gray-400">Trainingstage</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {goal.trainedDays} / {goal.targetDays}
            </span>
          </div>
          <ProgressBar value={goal.trainedDays} max={goal.targetDays} color="bg-violet-500" />
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-gray-400">{dayPct.toFixed(0)}%</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500 dark:text-gray-400">Punkte</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {goal.earnedPoints} / {goal.targetPoints}
            </span>
          </div>
          <ProgressBar value={goal.earnedPoints} max={goal.targetPoints} color="bg-primary-500" />
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-gray-400">{ptsPct.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
