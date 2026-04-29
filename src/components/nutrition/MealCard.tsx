import { useState } from 'react'
import { Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { MealEntry } from '../../types'
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from '../../lib/nutritionMath'

interface Props {
  meal: MealEntry
  onEdit: () => void
  onDelete: () => void
}

export function MealCard({ meal, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { totals } = meal

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
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
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-primary-500 transition-colors">
            <Edit2 size={16} />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-3 space-y-2 pt-2">
          {meal.components.map((c, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex-1 min-w-0">
                <span className="text-gray-700 dark:text-gray-300 font-medium truncate block">{c.nameSnapshot}</span>
                {c.brandSnapshot && <span className="text-gray-400 truncate block">{c.brandSnapshot}</span>}
              </div>
              <div className="flex gap-2 text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                <span>{c.amountGrams}g</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{c.computed.kcal} kcal</span>
              </div>
            </div>
          ))}
          {meal.notes && (
            <p className="text-xs text-gray-400 italic pt-1 border-t border-gray-100 dark:border-gray-800">{meal.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}
