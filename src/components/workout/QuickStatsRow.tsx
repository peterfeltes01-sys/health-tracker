import { Flame, Clock, Dumbbell } from 'lucide-react'
import type { WorkoutStats } from '../../types/workout'

interface QuickStatsRowProps {
  stats: WorkoutStats
}

export function QuickStatsRow({ stats }: QuickStatsRowProps) {
  const items = [
    {
      icon: Flame,
      label: 'Streak',
      value: `${stats.currentStreakDays}`,
      unit: 'Tage',
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      icon: Clock,
      label: 'Minuten',
      value: `${stats.totalMinutes}`,
      unit: 'gesamt',
      color: 'text-sky-500',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
    },
    {
      icon: Dumbbell,
      label: 'Einheiten',
      value: `${stats.totalSessions}`,
      unit: 'gesamt',
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ icon: Icon, label, value, unit, color, bg }) => (
        <div key={label} className={`${bg} rounded-2xl p-3 text-center`}>
          <Icon size={18} className={`${color} mx-auto mb-1`} />
          <div className={`text-xl font-black ${color}`}>{value}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{unit}</div>
        </div>
      ))}
    </div>
  )
}
