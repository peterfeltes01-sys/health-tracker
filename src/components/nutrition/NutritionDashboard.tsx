import { useMemo } from 'react'
import type { MealEntry } from '../../types'
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from '../../lib/nutritionMath'
import { MacroDonut } from './MacroDonut'
import { MealCard } from './MealCard'
import { Card } from '../shared/Card'
import { useSettingsStore } from '../../stores/settingsStore'

interface Props {
  meals: MealEntry[]
  onEditMeal: (meal: MealEntry) => void
  onDeleteMeal: (id: string) => void
  onAddMeal: () => void
}

const MACRO_COLORS = {
  carbs: '#3b82f6',
  fat: '#f59e0b',
  protein: '#ef4444',
}

export function NutritionDashboard({ meals, onEditMeal, onDeleteMeal, onAddMeal }: Props) {
  const { settings } = useSettingsStore()
  const goals = settings.nutritionGoals

  const totals = useMemo(() => {
    return meals.reduce(
      (acc, m) => ({
        kcal: acc.kcal + m.totals.kcal,
        carbs: acc.carbs + m.totals.carbs,
        fat: acc.fat + m.totals.fat,
        protein: acc.protein + m.totals.protein,
      }),
      { kcal: 0, carbs: 0, fat: 0, protein: 0 }
    )
  }, [meals])

  const goalCarbs = Math.round((goals.dailyKcal * goals.carbsPercent) / 100 / 4)
  const goalFat = Math.round((goals.dailyKcal * goals.fatPercent) / 100 / 9)
  const goalProtein = Math.round((goals.dailyKcal * goals.proteinPercent) / 100 / 4)

  const sortedMeals = [...meals].sort((a, b) => {
    const order = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 }
    return order[a.mealType] - order[b.mealType] || (a.time ?? '').localeCompare(b.time ?? '')
  })

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <MacroDonut
            kcal={totals.kcal}
            goalKcal={goals.dailyKcal}
            carbs={totals.carbs}
            fat={totals.fat}
            protein={totals.protein}
          />
          <div className="flex-1 space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tagesziel: {goals.dailyKcal} kcal</p>
            <div className="space-y-1.5">
              {[
                { label: 'Kohlenhydrate', val: totals.carbs, goal: goalCarbs, color: MACRO_COLORS.carbs },
                { label: 'Fett', val: totals.fat, goal: goalFat, color: MACRO_COLORS.fat },
                { label: 'Eiweiß', val: totals.protein, goal: goalProtein, color: MACRO_COLORS.protein },
              ].map(({ label, val, goal, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                    <span>{label}</span>
                    <span className="font-medium">{val}g / {goal}g</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, goal > 0 ? (val / goal) * 100 : 0)}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {sortedMeals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Noch keine Mahlzeit erfasst</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Tippe auf + um deine erste Mahlzeit hinzuzufügen</p>
          <button
            onClick={onAddMeal}
            className="mt-4 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            Mahlzeit hinzufügen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => {
            const typeMeals = sortedMeals.filter((m) => m.mealType === type)
            if (typeMeals.length === 0) return null
            return (
              <div key={type} className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {MEAL_TYPE_ICONS[type]} {MEAL_TYPE_LABELS[type]}
                </p>
                {typeMeals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onEdit={() => onEditMeal(meal)}
                    onDelete={() => onDeleteMeal(meal.id)}
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
