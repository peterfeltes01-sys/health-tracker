import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { de } from 'date-fns/locale'
import type { StepEntry, Activity } from '../../types'
import { toISODate } from '../../utils/calculations'
import { formatSteps } from '../../utils/formatters'

interface MonthlyHeatmapProps {
  steps: StepEntry[]
  activities: Activity[]
  stepGoal: number
}

export function MonthlyHeatmap({ steps, activities, stepGoal }: MonthlyHeatmapProps) {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startWeekday = (getDay(monthStart) + 6) % 7

  function getStepsForDay(date: string) {
    return steps.filter((s) => s.date === date).reduce((a, b) => a + b.steps, 0)
  }

  function getActivitiesForDay(date: string) {
    return activities.filter((a) => a.date === date).length
  }

  function getColor(daySteps: number, dayActs: number): string {
    if (daySteps === 0 && dayActs === 0) return 'bg-gray-100 dark:bg-gray-800'
    const pct = daySteps / stepGoal
    if (pct >= 1) return 'bg-primary-500'
    if (pct >= 0.75) return 'bg-primary-300'
    if (pct >= 0.5) return 'bg-primary-200'
    if (dayActs > 0) return 'bg-accent-300'
    return 'bg-gray-200 dark:bg-gray-700'
  }

  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const todayStr = toISODate(today)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {format(today, 'MMMM yyyy', { locale: de })}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="flex gap-1 items-center">
            <div className="w-3 h-3 rounded-sm bg-primary-500" /> Ziel erreicht
          </div>
          <div className="flex gap-1 items-center">
            <div className="w-3 h-3 rounded-sm bg-accent-300" /> Aktivität
          </div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((d) => (
          <div key={d} className="text-center text-xs text-gray-400 dark:text-gray-500 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startWeekday }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = toISODate(day)
          const daySteps = getStepsForDay(dateStr)
          const dayActs = getActivitiesForDay(dateStr)
          const isToday = dateStr === todayStr
          const isFuture = day > today

          return (
            <div
              key={dateStr}
              title={`${format(day, 'd. MMM', { locale: de })}: ${formatSteps(daySteps)} Schritte, ${dayActs} Aktivitäten`}
              className={`
                aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                transition-all cursor-default
                ${isFuture ? 'opacity-30' : ''}
                ${isToday ? 'ring-2 ring-primary-500 ring-offset-1' : ''}
                ${getColor(daySteps, dayActs)}
                ${daySteps >= stepGoal ? 'text-white' : 'text-gray-600 dark:text-gray-400'}
              `}
            >
              {format(day, 'd')}
            </div>
          )
        })}
      </div>
    </div>
  )
}
