import { Edit2, Trash2 } from 'lucide-react'
import type { MealEntry } from '../../types'
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from '../../lib/nutritionMath'

interface Props {
  meal: MealEntry
  onEdit: () => void
  onDelete: () => void
}

export function MealCard({ meal, onEdit, onDelete }: Props) {
  const { totals } = meal

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Meal header */}
      <div className="flex items-center gap-3 p-4">
        <span className="text-2xl">{MEAL_TYPE_ICONS[meal.mealType]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {MEAL_TYPE_LABELS[meal.mealType]}
            </p>
            {meal.time && (
              <span className="text-xs text-gray-400">{meal.time}</span>
            )}
          </div>
          <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <span className="font-semibold text-gray-800 dark:text-gray-200">{totals.kcal} kcal</span>
            <span>K: {totals.carbs}g</span>
            <span>F: {totals.fat}g</span>
            <span>E: {totals.protein}g</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-primary-500 transition-colors">
            <Edit2 size={16} />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Food items – always visible */}
      {meal.components.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-3 pt-2 space-y-2.5">
          {meal.components.map((c, i) => (
            <div key={i}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{c.nameSnapshot}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{c.amountGrams}g</span>
              </div>
              {c.brandSnapshot && (
                <span className="text-[11px] text-gray-400 block">{c.brandSnapshot}</span>
              )}
              <div className="flex gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                <span className="font-medium text-gray-600 dark:text-gray-300">{c.computed.kcal} kcal</span>
                <span>K: {c.computed.carbs}g</span>
                <span>F: {c.computed.fat}g</span>
                <span>E: {c.computed.protein}g</span>
              </div>
            </div>
          ))}
          {meal.notes && (
            <p className="text-xs text-gray-400 italic pt-1.5 border-t border-gray-100 dark:border-gray-800">{meal.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}
