import { Play, Pause, Pencil, Trash2, Calendar } from 'lucide-react'
import type { Routine } from '../../types/routine'
import { EXERCISES } from '../../data/exercises'

interface RoutineCardProps {
  routine: Routine
  isDue?: boolean
  onStart?: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}

export function RoutineCard({ routine, isDue, onStart, onEdit, onDelete, onToggleActive }: RoutineCardProps) {
  const names = routine.exercises
    .slice()
    .sort((a, b) => a.order - b.order)
    .slice(0, 3)
    .map((re) => EXERCISES.find((e) => e.id === re.exerciseId)?.name ?? re.exerciseId)

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border transition-colors ${
      isDue
        ? 'border-primary-200 dark:border-primary-800'
        : 'border-gray-100 dark:border-gray-800'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
                {routine.name}
              </h3>
              {isDue && (
                <span className="text-[10px] font-bold bg-primary-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                  Heute fällig
                </span>
              )}
              {!routine.isActive && (
                <span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full flex-shrink-0">
                  Pausiert
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Calendar size={11} />
              {routine.exercises.length} Übungen · täglich
            </p>
            {names.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {names.join(', ')}{routine.exercises.length > 3 ? ` +${routine.exercises.length - 3}` : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onToggleActive}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title={routine.isActive ? 'Pausieren' : 'Aktivieren'}
            >
              <Pause size={16} className={routine.isActive ? '' : 'opacity-40'} />
            </button>
            <button
              onClick={onEdit}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {onStart && routine.isActive && (
          <button
            onClick={onStart}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-primary-500 text-white font-semibold rounded-xl text-sm shadow-sm shadow-primary-500/20 active:scale-95 transition-transform"
          >
            <Play size={16} fill="currentColor" />
            Starten
          </button>
        )}
      </div>
    </div>
  )
}
