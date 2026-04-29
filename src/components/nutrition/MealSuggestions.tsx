import type { MealEntry, MealComponent } from '../../types'
import { MEAL_TYPE_ICONS } from '../../lib/nutritionMath'

interface Props {
  suggestions: MealEntry[]
  onApply: (components: MealComponent[]) => void
}

export function MealSuggestions({ suggestions, onApply }: Props) {
  if (suggestions.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Schnellauswahl
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {suggestions.map((meal) => {
          const names = meal.components.map((c) => c.nameSnapshot).join(' + ')
          return (
            <button
              key={meal.id}
              type="button"
              onClick={() => onApply(meal.components)}
              className="flex-shrink-0 flex flex-col gap-1 p-3 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900 text-left hover:bg-primary-100 dark:hover:bg-primary-950/50 transition-colors max-w-[180px]"
            >
              <span className="text-base">{MEAL_TYPE_ICONS[meal.mealType]}</span>
              <span className="text-xs font-medium text-primary-700 dark:text-primary-300 line-clamp-2 leading-tight">
                {names}
              </span>
              <span className="text-xs text-primary-500 dark:text-primary-400">
                {meal.totals.kcal} kcal
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
