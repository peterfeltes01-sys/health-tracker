import { useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { MealEditor } from '../components/nutrition/MealEditor'
import { useNutritionStore } from '../stores/nutritionStore'
import { toISODate } from '../utils/calculations'
import type { MealEntry } from '../types'

export function MealEditPage() {
  const { id } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { meals, loadMealsByDate, addMeal, updateMeal, loadCustomProducts, loadRecentProducts } = useNutritionStore()

  const date = searchParams.get('date') ?? toISODate(new Date())
  const editingMeal = id ? meals.find((m) => m.id === id) : undefined

  useEffect(() => {
    loadCustomProducts()
    loadRecentProducts()
    if (date) loadMealsByDate(date)
    if (editingMeal?.date) loadMealsByDate(editingMeal.date)
  }, [date])

  async function handleSave(meal: Omit<MealEntry, 'id'>) {
    if (editingMeal) {
      await updateMeal({ ...meal, id: editingMeal.id })
    } else {
      await addMeal(meal)
    }
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900 dark:text-white">
            {editingMeal ? 'Mahlzeit bearbeiten' : 'Mahlzeit hinzufügen'}
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <MealEditor
          initial={editingMeal}
          date={editingMeal?.date ?? date}
          onSave={handleSave}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  )
}
