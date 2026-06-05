import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useHabitStore } from '../../stores/habitStore'
import { isEntryFulfilled, isDueOnDate } from '../../lib/habitStats'
import type { Habit } from '../../types/habits'

interface HabitDashboardWidgetProps {
  today: string
}

export function HabitDashboardWidget({ today }: HabitDashboardWidgetProps) {
  const navigate = useNavigate()
  const { habits, entries, toggleEntry } = useHabitStore()

  const dueHabits = habits.filter((h) => !h.archivedAt && isDueOnDate(h, today))
  const doneCount = dueHabits.filter((h) => {
    const entry = entries.find((e) => e.habitId === h.id && e.date === today)
    return entry && isEntryFulfilled(entry, h)
  }).length

  async function handleIconTap(e: React.MouseEvent, habit: Habit) {
    e.stopPropagation()
    if (habit.type === 'binary') {
      await toggleEntry(habit, today)
    } else {
      navigate(`/habits/${habit.id}`)
    }
  }

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden cursor-pointer"
      onClick={() => navigate('/habits')}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 dark:text-white">
            Gewohnheiten heute
          </span>
          {dueHabits.length > 0 && (
            <span className="text-xs font-bold bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full">
              {doneCount}/{dueHabits.length}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate('/habits/new')
          }}
          className="flex items-center gap-1 text-xs font-semibold text-violet-500 bg-violet-50 dark:bg-violet-950/50 px-2.5 py-1.5 rounded-xl transition-colors"
        >
          <Plus size={14} /> Neu
        </button>
      </div>

      {/* Icon grid */}
      {dueHabits.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-2xl mb-1">🎯</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Noch keine Gewohnheiten angelegt
          </p>
        </div>
      ) : (
        <div className="p-3">
          <div className="grid grid-cols-5 gap-2">
            {dueHabits.map((habit) => {
              const entry = entries.find((e) => e.habitId === habit.id && e.date === today) ?? null
              const fulfilled = entry ? isEntryFulfilled(entry, habit) : false
              return (
                <button
                  key={habit.id}
                  onClick={(e) => handleIconTap(e, habit)}
                  className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                >
                  {/* Icon bubble */}
                  <div className="relative w-full aspect-square rounded-2xl flex items-center justify-center text-2xl"
                    style={{
                      backgroundColor: fulfilled ? habit.color : habit.color + '22',
                    }}
                  >
                    <span style={{ filter: fulfilled ? 'none' : 'grayscale(30%)' }}>
                      {habit.icon}
                    </span>
                    {/* Done checkmark badge */}
                    {fulfilled && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth={3.5} className="w-2.5 h-2.5" style={{ stroke: habit.color }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Label */}
                  <span className={`text-[10px] leading-tight text-center w-full truncate px-0.5 ${fulfilled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
                    {habit.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
