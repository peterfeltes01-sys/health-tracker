import { useState } from 'react'
import { Plus, Save } from 'lucide-react'
import type { FoodProduct, MealComponent, MealEntry, MealType, NutritionFacts } from '../../types'
import { computeForAmount, sumNutrition, MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from '../../lib/nutritionMath'
import { ProductSearch } from './ProductSearch'
import { ComponentRow } from './ComponentRow'
import { MealSuggestions } from './MealSuggestions'
import { Button } from '../shared/Button'
import { Select } from '../shared/Input'
import { useNutritionStore } from '../../stores/nutritionStore'
import { useMealSuggestions } from '../../hooks/useMealSuggestions'

const EMPTY_NUTRITION: NutritionFacts = { kcal: 0, carbs: 0, fat: 0, satFat: 0, protein: 0 }

interface AmountPickerProps {
  product: FoodProduct
  onAdd: (component: MealComponent) => void
  onCancel: () => void
}

function AmountPicker({ product, onAdd, onCancel }: AmountPickerProps) {
  const [grams, setGrams] = useState(product.defaultServingGrams ?? 100)
  const computed = computeForAmount(product.per100g, grams)

  return (
    <div className="bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl flex-shrink-0">
            {product.source === 'custom' ? '⭐' : '🛒'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{product.name}</p>
          {product.brand && <p className="text-xs text-gray-500">{product.brand}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="number"
          min="1"
          step="1"
          value={grams}
          onChange={(e) => setGrams(Math.max(1, parseFloat(e.target.value) || 0))}
          className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-center"
        />
        <span className="text-sm text-gray-600 dark:text-gray-400">g</span>
        <div className="flex gap-3 text-sm text-gray-700 dark:text-gray-300 ml-2">
          <span className="font-bold text-primary-600 dark:text-primary-400">{computed.kcal} kcal</span>
          <span>K {computed.carbs}g</span>
          <span>F {computed.fat}g</span>
          <span>E {computed.protein}g</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>Abbrechen</Button>
        <Button size="sm" onClick={() => onAdd({
          productId: product.id,
          productSource: product.source,
          nameSnapshot: product.name,
          brandSnapshot: product.brand,
          per100gSnapshot: product.per100g,
          amountGrams: grams,
          computed,
        })}>
          <Plus size={14} /> Hinzufügen
        </Button>
      </div>
    </div>
  )
}

interface Props {
  initial?: MealEntry
  date: string
  onSave: (meal: Omit<MealEntry, 'id'>) => Promise<void>
  onCancel: () => void
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function MealEditor({ initial, date, onSave, onCancel }: Props) {
  const [mealType, setMealType] = useState<MealType>(initial?.mealType ?? 'breakfast')
  const [time, setTime] = useState(initial?.time ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [components, setComponents] = useState<MealComponent[]>(initial?.components ?? [])
  const [pendingProduct, setPendingProduct] = useState<FoodProduct | null>(null)
  const [showSearch, setShowSearch] = useState(!initial)
  const [saving, setSaving] = useState(false)
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)

  const { meals, saveTemplate, cacheRecentProduct } = useNutritionStore()
  const suggestions = useMealSuggestions(meals, mealType)

  const totals = components.length > 0
    ? sumNutrition(components.map((c) => c.computed))
    : EMPTY_NUTRITION

  function handleSelectProduct(product: FoodProduct) {
    setPendingProduct(product)
    setShowSearch(false)
  }

  function handleAddComponent(component: MealComponent) {
    setComponents((prev) => [...prev, component])
    setPendingProduct(null)
    cacheRecentProduct({
      id: component.productId,
      source: component.productSource,
      name: component.nameSnapshot,
      brand: component.brandSnapshot,
      per100g: component.per100gSnapshot,
    })
  }

  function handleApplySuggestion(suggested: MealComponent[]) {
    setComponents(suggested)
  }

  async function handleSave() {
    if (components.length === 0) return
    setSaving(true)
    try {
      const meal: Omit<MealEntry, 'id'> = {
        date,
        mealType,
        time: time || undefined,
        components,
        totals,
        notes: notes.trim() || undefined,
        timestamp: new Date().toISOString(),
      }
      await onSave(meal)
      if (saveAsTemplate) {
        const names = components.map((c) => c.nameSnapshot).join(' + ')
        await saveTemplate({
          name: names.length > 40 ? names.slice(0, 40) + '…' : names,
          mealType,
          components: components.map(({ computed: _c, ...rest }) => rest),
          useCount: 1,
          lastUsed: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 space-y-4 pb-48">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Mahlzeit"
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType)}
            options={MEAL_TYPES.map((t) => ({ value: t, label: `${MEAL_TYPE_ICONS[t]} ${MEAL_TYPE_LABELS[t]}` }))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Uhrzeit</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {suggestions.length > 0 && components.length === 0 && (
          <MealSuggestions suggestions={suggestions} onApply={handleApplySuggestion} />
        )}

        {components.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Zutaten</p>
            {components.map((c, i) => (
              <ComponentRow
                key={i}
                component={c}
                onChange={(updated) => setComponents((prev) => prev.map((x, j) => (j === i ? updated : x)))}
                onDelete={() => setComponents((prev) => prev.filter((_, j) => j !== i))}
              />
            ))}
          </div>
        )}

        {pendingProduct && (
          <AmountPicker
            product={pendingProduct}
            onAdd={handleAddComponent}
            onCancel={() => setPendingProduct(null)}
          />
        )}

        {showSearch ? (
          <ProductSearch onSelect={handleSelectProduct} />
        ) : (
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
          >
            <Plus size={16} /> Zutat hinzufügen
          </button>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notiz (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="z.B. nach dem Training"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={saveAsTemplate}
            onChange={(e) => setSaveAsTemplate(e.target.checked)}
            className="w-4 h-4 rounded accent-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Als Vorlage merken</span>
        </label>
      </div>

      {/* Sticky footer with totals — sits above BottomNav (bottom-14 = 56px) */}
      <div className="fixed bottom-14 left-0 right-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 px-4 py-3 z-30">
        <div className="max-w-lg mx-auto space-y-2">
          {components.length > 0 && (
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 px-1">
              <span className="font-bold text-gray-900 dark:text-white">{totals.kcal} kcal</span>
              <span>K: {totals.carbs}g</span>
              <span>F: {totals.fat}g</span>
              <span>E: {totals.protein}g</span>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={onCancel}>Abbrechen</Button>
            <Button fullWidth onClick={handleSave} disabled={components.length === 0 || saving}>
              <Save size={16} />
              {saving ? 'Speichern…' : 'Speichern'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
