import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, History } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { NutritionDashboard } from '../components/nutrition/NutritionDashboard'
import { useNutritionStore } from '../stores/nutritionStore'
import { toISODate } from '../utils/calculations'
import type { MealEntry } from '../types'

export function NutritionPage() {
  const today = toISODate(new Date())
  const [searchParams] = useSearchParams()
  const initialDate = searchParams.get('date') ?? today
  const [date, setDate] = useState(initialDate)
  const { meals, loadMealsByDate, deleteMeal, loadCustomProducts, loadRecentProducts } = useNutritionStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadMealsByDate(date)
  }, [date])

  useEffect(() => {
    loadCustomProducts()
    loadRecentProducts()
  }, [])

  const dayMeals = meals.filter((m) => m.date === date)

  function changeDate(delta: number) {
    const d = new Date(date)
    d.setDate(d.getDate() + delta)
    setDate(toISODate(d))
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    const today = toISODate(new Date())
    const yesterday = toISODate(new Date(Date.now() - 86400000))
    if (dateStr === today) return 'Heute'
    if (dateStr === yesterday) return 'Gestern'
    return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <>
      <Header title="Ernährung" />
      <PageWrapper>
        <div className="space-y-4">
          {/* Date navigation */}
          <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3">
            <button onClick={() => changeDate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDate(today)}
                className="text-sm font-semibold text-gray-900 dark:text-white"
              >
                {formatDate(date)}
              </button>
              <button
                onClick={() => navigate('/nutrition/history')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Verlauf"
                title="Verlauf öffnen"
              >
                <History size={16} />
              </button>
            </div>
            <button
              onClick={() => changeDate(1)}
              disabled={date >= today}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          </div>

          <NutritionDashboard
            meals={dayMeals}
            onEditMeal={(meal: MealEntry) => navigate(`/nutrition/meal/${meal.id}`)}
            onDeleteMeal={deleteMeal}
            onAddMeal={() => navigate(`/nutrition/meal?date=${date}`)}
          />
        </div>
      </PageWrapper>

      {/* FAB */}
      <button
        onClick={() => navigate(`/nutrition/meal?date=${date}`)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg shadow-primary-500/30 flex items-center justify-center transition-all active:scale-95 z-30"
      >
        <Plus size={24} />
      </button>
    </>
  )
}
