import { useState } from 'react'
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import type { MealComponent } from '../../types'
import { computeForAmount } from '../../lib/nutritionMath'

interface Props {
  component: MealComponent
  onChange: (updated: MealComponent) => void
  onDelete: () => void
}

export function ComponentRow({ component, onChange, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)

  function handleAmountChange(val: string) {
    const grams = parseFloat(val)
    if (!isFinite(grams) || grams <= 0) return
    const computed = computeForAmount(component.per100gSnapshot, grams)
    onChange({ ...component, amountGrams: grams, computed })
  }

  const { computed } = component

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{component.nameSnapshot}</p>
          {component.brandSnapshot && (
            <p className="text-xs text-gray-500 truncate">{component.brandSnapshot}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="number"
          min="1"
          step="1"
          value={component.amountGrams}
          onChange={(e) => handleAmountChange(e.target.value)}
          className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <span className="text-xs text-gray-500">g</span>
        <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-white">{computed.kcal} kcal</span>
          <span>K: {computed.carbs}g</span>
          <span>F: {computed.fat}g</span>
          <span>E: {computed.protein}g</span>
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-200 dark:border-gray-700">
          {component.per100gSnapshot.sugars != null && (
            <div className="text-xs">
              <span className="text-gray-400">davon Zucker</span>
              <p className="font-medium text-gray-700 dark:text-gray-300">{computed.sugars ?? '—'}g</p>
            </div>
          )}
          <div className="text-xs">
            <span className="text-gray-400">ges. Fettsäuren</span>
            <p className="font-medium text-gray-700 dark:text-gray-300">{computed.satFat}g</p>
          </div>
          {component.per100gSnapshot.fiber != null && (
            <div className="text-xs">
              <span className="text-gray-400">Ballaststoffe</span>
              <p className="font-medium text-gray-700 dark:text-gray-300">{computed.fiber ?? '—'}g</p>
            </div>
          )}
          {component.per100gSnapshot.salt != null && (
            <div className="text-xs">
              <span className="text-gray-400">Salz</span>
              <p className="font-medium text-gray-700 dark:text-gray-300">{computed.salt ?? '—'}g</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
