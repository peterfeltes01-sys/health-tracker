import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Card } from '../components/shared/Card'
import { useNutritionStore } from '../stores/nutritionStore'
import { useSettingsStore } from '../stores/settingsStore'
import { toISODate, getDatesInRange } from '../utils/calculations'
import { MEAL_TYPE_ICONS, MEAL_TYPE_LABELS } from '../lib/nutritionMath'
import type { MealEntry, MealType } from '../types'
import { subDays, parseISO, format } from 'date-fns'
import { de } from 'date-fns/locale'

const RANGES = [
  { label: '7T', days: 7 },
  { label: '14T', days: 14 },
  { label: '30T', days: 30 },
] as const

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function NutritionHistory() {
  const navigate = useNavigate()
  const today = toISODate(new Date())
  const [rangeDays, setRangeDays] = useState<number>(14)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  const { meals, loadMealsByRange } = useNutritionStore()
  const dailyKcalGoal = useSettingsStore((s) => s.settings.nutritionGoals?.dailyKcal ?? 2000)

  useEffect(() => {
    const from = toISODate(subDays(new Date(), 30))
    loadMealsByRange(from, today)
  }, [today])

  const mealsByDate = useMemo(() => {
    const map: Record<string, MealEntry[]> = {}
    for (const m of meals) {
      if (!map[m.date]) map[m.date] = []
      map[m.date].push(m)
    }
    return map
  }, [meals])

  const dateList = useMemo(() => {
    const from = toISODate(subDays(new Date(), rangeDays - 1))
    return getDatesInRange(from, today)
  }, [rangeDays, today])

  const chartData = useMemo(() => {
    return dateList.map((d) => {
      const list = mealsByDate[d] ?? []
      const kcal = list.reduce((s, m) => s + m.totals.kcal, 0)
      return {
        date: d,
        label: format(parseISO(d), rangeDays > 7 ? 'd.M.' : 'EEE', { locale: de }),
        kcal,
      }
    })
  }, [dateList, mealsByDate, rangeDays])

  const stats = useMemo(() => {
    const days = chartData
    const tracked = days.filter((d) => d.kcal > 0)
    const total = tracked.reduce((s, d) => s + d.kcal, 0)
    const avg = tracked.length > 0 ? Math.round(total / tracked.length) : 0
    const within = tracked.filter((d) => d.kcal <= dailyKcalGoal * 1.05).length
    return { avg, trackedDays: tracked.length, totalDays: days.length, within }
  }, [chartData, dailyKcalGoal])

  const reverseDates = useMemo(() => [...dateList].reverse(), [dateList])

  return (
    <>
      <Header title="Ernährungs-Verlauf" />
      <PageWrapper>
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowLeft size={16} /> Zurück
          </button>

          <Card>
            <div className="flex gap-1 mb-3">
              {RANGES.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setRangeDays(r.days)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    rangeDays === r.days
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(v) => [`${v} kcal`, 'Kalorien']}
                />
                <ReferenceLine y={dailyKcalGoal} stroke="#10b981" strokeDasharray="4 4" />
                <Bar dataKey="kcal" radius={[4, 4, 0, 0]}>
                  {chartData.map((d) => (
                    <Cell key={d.date} fill={d.kcal === 0 ? '#e5e7eb' : d.kcal > dailyKcalGoal * 1.05 ? '#f97316' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.avg}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Ø kcal</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.trackedDays}/{stats.totalDays}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Tracked</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-500">{stats.within}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">im Ziel</p>
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
              Tageshistorie
            </h3>
            {reverseDates.map((date) => {
              const dayMeals = mealsByDate[date] ?? []
              const kcal = dayMeals.reduce((s, m) => s + m.totals.kcal, 0)
              const carbs = dayMeals.reduce((s, m) => s + m.totals.carbs, 0)
              const fat = dayMeals.reduce((s, m) => s + m.totals.fat, 0)
              const protein = dayMeals.reduce((s, m) => s + m.totals.protein, 0)
              const isToday = date === today
              const expanded = expandedDate === date
              const hasData = dayMeals.length > 0

              return (
                <div
                  key={date}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedDate(expanded ? null : date)}
                    className="w-full flex items-center gap-3 p-3 text-left active:scale-[0.99] transition-transform"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {format(parseISO(date), 'EEEE, d. MMM', { locale: de })}
                        </p>
                        {isToday && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
                            heute
                          </span>
                        )}
                      </div>
                      {hasData ? (
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{kcal} kcal</span>
                          <span>K: {Math.round(carbs)}g</span>
                          <span>F: {Math.round(fat)}g</span>
                          <span>E: {Math.round(protein)}g</span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic mt-0.5">keine Mahlzeiten erfasst</p>
                      )}
                    </div>
                    <ChevronRight
                      size={18}
                      className={`text-gray-300 dark:text-gray-600 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {expanded && hasData && (
                    <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-3">
                      {MEAL_ORDER.map((type) => {
                        const list = dayMeals
                          .filter((m) => m.mealType === type)
                          .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
                        if (list.length === 0) return null
                        const typeKcal = list.reduce((s, m) => s + m.totals.kcal, 0)
                        return (
                          <div key={type} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                <span>{MEAL_TYPE_ICONS[type]}</span>
                                <span>{MEAL_TYPE_LABELS[type]}</span>
                              </p>
                              <span className="text-[11px] text-gray-500">{typeKcal} kcal</span>
                            </div>
                            {list.map((m) => (
                              <div key={m.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 space-y-1">
                                {m.components.map((c, i) => (
                                  <div key={i} className="flex items-baseline justify-between gap-2 text-xs">
                                    <span className="text-gray-700 dark:text-gray-300 truncate">{c.nameSnapshot}</span>
                                    <span className="text-gray-400 flex-shrink-0">{c.amountGrams}g · {c.computed.kcal} kcal</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )
                      })}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/nutrition?date=${date}`) }}
                        className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                      >
                        Tag öffnen →
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
