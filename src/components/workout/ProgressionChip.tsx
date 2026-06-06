import { useEffect } from 'react'
import { TrendingUp, TrendingDown, Check } from 'lucide-react'
import { useWorkoutStore } from '../../stores/workoutStore'
import type { Exercise } from '../../types/workout'
import { EXERCISES } from '../../data/exercises'

interface Props {
  exercise: Exercise
  onAccept?: (toExerciseId: string) => void
}

export function ProgressionChip({ exercise, onAccept }: Props) {
  const { computeProgressionForExercise, progressionSuggestion, acceptProgression, movementFamilies } =
    useWorkoutStore()

  useEffect(() => {
    computeProgressionForExercise(exercise)
  }, [exercise.id])

  if (!progressionSuggestion || progressionSuggestion.kind === 'hold') return null

  const suggestion = progressionSuggestion

  const targetExercise =
    (suggestion.kind === 'advance' || suggestion.kind === 'regress')
      ? EXERCISES.find((e) => e.id === suggestion.toExerciseId)
      : null

  if (!targetExercise) return null

  const isAdvance = suggestion.kind === 'advance'
  const family = movementFamilies.find((f) => f.levels.includes(exercise.id))
  const currentLevel = family ? family.levels.indexOf(exercise.id) + 1 : null
  const targetLevel = family ? family.levels.indexOf(suggestion.toExerciseId) + 1 : null

  const handleAccept = () => {
    acceptProgression(exercise.id, suggestion.toExerciseId)
    onAccept?.(suggestion.toExerciseId)
  }

  return (
    <div
      className={`mx-4 mb-2 rounded-2xl px-3 py-2.5 flex items-start gap-2 ${
        isAdvance
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50'
          : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50'
      }`}
    >
      <div className="mt-0.5 flex-shrink-0">
        {isAdvance ? (
          <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <TrendingDown size={16} className="text-amber-600 dark:text-amber-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-semibold ${
            isAdvance
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-amber-700 dark:text-amber-300'
          }`}
        >
          {isAdvance ? 'Bereit für die nächste Stufe' : 'Leichtere Variante empfohlen'}
          {currentLevel && targetLevel ? ` (${currentLevel} → ${targetLevel})` : ''}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">
          {targetExercise.name}
        </p>
      </div>
      <button
        onClick={handleAccept}
        className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl active:scale-95 transition-transform ${
          isAdvance
            ? 'bg-emerald-500 text-white'
            : 'bg-amber-500 text-white'
        }`}
      >
        <Check size={11} />
        Übernehmen
      </button>
    </div>
  )
}
