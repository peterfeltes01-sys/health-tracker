import { ArrowUp, ArrowDown, ChevronRight } from 'lucide-react'
import type { TrainingProgressionSuggestion } from '../../../types/training'

interface ProgressionSuggestionCardProps {
  suggestion: TrainingProgressionSuggestion
  toExerciseName?: string
  onAccept: () => void
  onDismiss: () => void
}

export function ProgressionSuggestionCard({
  suggestion,
  toExerciseName,
  onAccept,
  onDismiss,
}: ProgressionSuggestionCardProps) {
  const isAdvance = suggestion.kind === 'advance'
  const isRegress = suggestion.kind === 'regress'

  const iconBg = isAdvance
    ? 'bg-green-100 dark:bg-green-950'
    : isRegress
    ? 'bg-amber-100 dark:bg-amber-950'
    : 'bg-blue-100 dark:bg-blue-950'

  const iconColor = isAdvance
    ? 'text-green-600 dark:text-green-400'
    : isRegress
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-blue-600 dark:text-blue-400'

  const actionLabel = isAdvance ? 'Stufe hochgehen' : isRegress ? 'Stufe zurück' : 'Ziel anpassen'

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {isAdvance ? (
            <ArrowUp size={18} className={iconColor} />
          ) : isRegress ? (
            <ArrowDown size={18} className={iconColor} />
          ) : (
            <ChevronRight size={18} className={iconColor} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {suggestion.exerciseName}
          </p>
          {suggestion.fromLevel !== undefined && suggestion.toLevel !== undefined && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Stufe {suggestion.fromLevel} → Stufe {suggestion.toLevel}
              {toExerciseName ? ` (${toExerciseName})` : ''}
            </p>
          )}
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
            {suggestion.reason}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onDismiss}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 active:scale-95 transition-transform"
        >
          Später
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-primary-500 shadow-sm shadow-primary-500/30 active:scale-95 transition-transform"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
