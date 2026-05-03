import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Footprints, BarChart2, History, Settings, Package,
  UtensilsCrossed, Wind, Droplets, ChevronDown, ChevronUp, Trash2,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ActivityCard } from '../components/activities/ActivityCard'
import { ActivityForm } from '../components/activities/ActivityForm'
import { MacroDonut } from '../components/nutrition/MacroDonut'
import { Modal } from '../components/shared/Modal'
import { Card } from '../components/shared/Card'
import { Input } from '../components/shared/Input'
import { Button } from '../components/shared/Button'
import { useStepsStore } from '../stores/stepsStore'
import { useActivitiesStore } from '../stores/activitiesStore'
import { useHydrationStore } from '../stores/hydrationStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useNutritionStore } from '../stores/nutritionStore'
import { useWeightStore } from '../stores/weightStore'
import { useBloodPressureStore } from '../stores/bloodPressureStore'
import { toISODate } from '../utils/calculations'
import { BP_CATEGORY_META } from '../lib/bloodPressure'
import { DRINK_TYPES } from '../utils/constants'
import { formatSteps, formatHydration } from '../utils/formatters'
import type { Activity, HydrationEntry } from '../types'
import { subDays } from 'date-fns'

const SHORTCUTS = [
  { icon: Wind,            label: 'Atem',       to: '/breathing',          color: 'text-teal-500',    bg: 'bg-teal-50 dark:bg-teal-950/40' },
  { icon: Footprints,      label: 'Schritte',   to: '/steps-history',      color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { icon: UtensilsCrossed, label: 'Ernährung',  to: '/nutrition/history',  color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-950/40' },
  { icon: BarChart2,       label: 'Statistik',  to: '/stats',              color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-950/40' },
  { icon: History,         label: 'Verlauf',    to: '/history',            color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/40' },
  { icon: Package,         label: 'Produkte',   to: '/nutrition/products', color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/40' },
  { icon: Settings,        label: 'Einstellungen', to: '/settings',        color: 'text-gray-500',    bg: 'bg-gray-100 dark:bg-gray-800' },
]

const MACRO_COLORS = { carbs: '#3b82f6', fat: '#f59e0b', protein: '#ef4444' }
const DAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

export function Dashboard() {
  const today = toISODate(new Date())
  const navigate = useNavigate()

  const [showActivityModal, setShowActivityModal] = useState(false)
  const [editActivity, setEditActivity]           = useState<Activity | null>(null)
  const [showHydDetails, setShowHydDetails]       = useState(false)
  const [drinkType, setDrinkType]                 = useState<HydrationEntry['drinkType']>('water')
  const [customMl, setCustomMl]                   = useState('')
  const [stepDate, setStepDate]                   = useState(() => today)
  const [stepCount, setStepCount]                 = useState('')

  const { loadByRange: loadStepsRange, getTotalForDate, seedIfEmpty: seedSteps, setTotalForDate } = useStepsStore()
  const { entries: activities, loadByDate: loadActivities, addActivity, updateActivity, deleteActivity } = useActivitiesStore()
  const { entries: hydrationEntries, loadByDate: loadHydration, getTotalForDate: getHydTotal, addHydration, deleteEntry: deleteHydration } = useHydrationStore()
  const { settings } = useSettingsStore()
  const { meals, loadMealsByDate } = useNutritionStore()
  const { entries: weightEntries, load: loadWeight } = useWeightStore()
  const { entries: bpEntries, load: loadBP } = useBloodPressureStore()

  useEffect(() => {
    let cancelled = false
    async function init() {
      await seedSteps(today, [7842, 9120, 6450, 11203, 8755, 7398, 8210])
      if (cancelled) return
      const stepsFrom = toISODate(subDays(new Date(), 30))
      await loadStepsRange(stepsFrom, today)
    }
    init()
    loadActivities(today)
    loadHydration(today)
    loadMealsByDate(today)
    const from = toISODate(subDays(new Date(), 30))
    loadWeight(from)
    loadBP(from)
    return () => { cancelled = true }
  }, [today])

  // ── Derived values ────────────────────────────────────────────
  const todaySteps      = getTotalForDate(today)
  const todayHydration  = getHydTotal(today)
  const todayActivities = activities.filter((a) => a.date === today)
  const todayHydEntries = hydrationEntries.filter((e) => e.date === today)
  const hydPct          = Math.min(100, Math.round((todayHydration / settings.dailyHydrationGoalMl) * 100))

  // Nutrition
  const todayMeals     = meals.filter((m) => m.date === today)
  const todayKcal      = todayMeals.reduce((s, m) => s + m.totals.kcal, 0)
  const kcalGoal       = settings.nutritionGoals?.dailyKcal ?? 2000
  const todayNutrition = todayMeals.reduce(
    (acc, m) => ({ carbs: acc.carbs + m.totals.carbs, fat: acc.fat + m.totals.fat, protein: acc.protein + m.totals.protein }),
    { carbs: 0, fat: 0, protein: 0 }
  )
  const goalCarbs = Math.round((kcalGoal * (settings.nutritionGoals?.carbsPercent  ?? 50)) / 100 / 4)
  const goalFat   = Math.round((kcalGoal * (settings.nutritionGoals?.fatPercent    ?? 30)) / 100 / 9)
  const goalProt  = Math.round((kcalGoal * (settings.nutritionGoals?.proteinPercent ?? 20)) / 100 / 4)

  // Weight / BP
  const latestWeight  = [...weightEntries].sort((a, b) => b.date.localeCompare(a.date))[0]
  const weekAgoWeight = [...weightEntries].sort((a, b) => b.date.localeCompare(a.date)).find((e) => e.date <= toISODate(subDays(new Date(), 7)))
  const weightDiff    = latestWeight && weekAgoWeight ? latestWeight.weightKg - weekAgoWeight.weightKg : null
  const latestBP      = [...bpEntries].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))[0]
  const bpMeta        = latestBP ? BP_CATEGORY_META[latestBP.category] : null

  // 7-day steps chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d    = subDays(new Date(), 6 - i)
    const date = toISODate(d)
    return { date, label: DAY_SHORT[d.getDay()], steps: getTotalForDate(date), isToday: date === today }
  })
  const maxSteps = Math.max(...last7Days.map((d) => d.steps), 1000)

  // ── Handlers ──────────────────────────────────────────────────
  async function handleSaveActivity(activity: Activity) {
    if (editActivity) await updateActivity(activity)
    else await addActivity(activity)
    setShowActivityModal(false)
    setEditActivity(null)
    loadActivities(today)
  }

  function handleAddSteps() {
    const n = parseInt(stepCount)
    if (n > 0) { setTotalForDate(n, stepDate); setStepCount('') }
  }

  function handleAddCustomMl() {
    const n = parseInt(customMl)
    if (n > 0) { addHydration(n, drinkType); setCustomMl('') }
  }

  const widgets = settings.dashboardWidgets

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      <Header />
      <PageWrapper>
        <div className="space-y-4">

          {/* ── Schnellzugriff ── */}
          {widgets.shortcuts && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Schnellzugriff</p>
            <div className="grid grid-cols-4 gap-2">
              {SHORTCUTS.map(({ icon: Icon, label, to, color, bg }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl ${bg} active:scale-95 transition-transform`}
                >
                  <Icon size={20} className={color} />
                  <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
          )}

          {/* ── Ernährung ── */}
          {widgets.nutrition && (
          <Card onClick={() => navigate('/nutrition')} className="cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">🥗 Ernährung heute</p>
              <p className="text-xs text-gray-400">Ziel: {kcalGoal} kcal</p>
            </div>
            <div className="flex items-center gap-4">
              <MacroDonut
                kcal={todayKcal}
                goalKcal={kcalGoal}
                carbs={todayNutrition.carbs}
                fat={todayNutrition.fat}
                protein={todayNutrition.protein}
                size={110}
              />
              <div className="flex-1 space-y-2">
                {[
                  { label: 'Kohlenhydrate', val: todayNutrition.carbs,   goal: goalCarbs, color: MACRO_COLORS.carbs   },
                  { label: 'Fett',          val: todayNutrition.fat,     goal: goalFat,   color: MACRO_COLORS.fat     },
                  { label: 'Eiweiß',        val: todayNutrition.protein, goal: goalProt,  color: MACRO_COLORS.protein },
                ].map(({ label, val, goal, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                      <span>{label}</span>
                      <span className="font-medium tabular-nums">{val}g / {goal}g</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, goal > 0 ? (val / goal) * 100 : 0)}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          )}

          {/* ── Gewicht + Blutdruck ── */}
          {widgets.bodyValues && (
          <div className="grid grid-cols-2 gap-3">
            <Card padding="sm" onClick={() => navigate('/values')} className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gewicht</p>
              {latestWeight ? (
                <>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{latestWeight.weightKg.toFixed(1)}</span>
                    <span className="text-[10px] text-gray-400">kg</span>
                  </div>
                  {weightDiff !== null && (
                    <span className={`text-[11px] font-semibold ${weightDiff < 0 ? 'text-green-500' : weightDiff > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg (7 Tage)
                    </span>
                  )}
                </>
              ) : <span className="text-sm text-gray-400">—</span>}
            </Card>

            <Card padding="sm" onClick={() => navigate('/values')} className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Blutdruck</p>
              {latestBP && bpMeta ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: bpMeta.color }} />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{latestBP.systolic}/{latestBP.diastolic}</span>
                  </div>
                  <p className="text-[10px] font-medium" style={{ color: bpMeta.color }}>{bpMeta.label}</p>
                </>
              ) : <span className="text-sm text-gray-400">—</span>}
            </Card>
          </div>
          )}

          {/* ── Flüssigkeit ── */}
          {widgets.hydration && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Droplets size={17} className="text-blue-500" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Flüssigkeit heute</span>
                  <span className="text-xs text-gray-400 tabular-nums">
                    {formatHydration(todayHydration)} / {formatHydration(settings.dailyHydrationGoalMl)}
                  </span>
                </div>
                <button
                  onClick={() => setShowHydDetails((v) => !v)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-500 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5 rounded-xl transition-colors"
                >
                  {showHydDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  Eintragen
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-400 transition-all duration-500"
                    style={{ width: `${hydPct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums w-8 text-right">{hydPct}%</span>
              </div>
            </div>

            {showHydDetails && (
              <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-3">
                {/* Drink type */}
                <div className="flex flex-wrap gap-1.5">
                  {DRINK_TYPES.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDrinkType(d.id as HydrationEntry['drinkType'])}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        drinkType === d.id
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <span>{d.icon}</span> {d.label}
                    </button>
                  ))}
                </div>

                {/* Quick-add */}
                <div className="grid grid-cols-4 gap-2">
                  {settings.quickAddAmounts.map((ml) => (
                    <button
                      key={ml}
                      onClick={() => addHydration(ml, drinkType)}
                      className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl py-2 text-center active:scale-95 transition-transform"
                    >
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">+{ml >= 1000 ? `${ml / 1000}L` : ml}</div>
                      <div className="text-[10px] text-blue-400">ml</div>
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Menge in ml"
                    value={customMl}
                    onChange={(e) => setCustomMl(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleAddCustomMl()}
                    className="flex-1"
                  />
                  <Button onClick={handleAddCustomMl} size="md">+</Button>
                </div>

                {/* Today's entries */}
                {todayHydEntries.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Heute</p>
                    {[...todayHydEntries].reverse().map((entry) => {
                      const dt = DRINK_TYPES.find((d) => d.id === entry.drinkType)
                      return (
                        <div key={entry.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{dt?.icon ?? '💧'}</span>
                            <div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatHydration(entry.amountMl)}</span>
                              <span className="text-xs text-gray-400 ml-1">{dt?.label}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteHydration(entry.id)}
                            className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* ── Schritte ── */}
          {widgets.steps && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Footprints size={17} className="text-emerald-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Schritte</span>
              </div>
              <span className="text-xs text-gray-400 tabular-nums">
                {formatSteps(todaySteps)} / {formatSteps(settings.dailyStepGoal)}
              </span>
            </div>

            {/* 7-day bar chart */}
            <div className="flex items-end gap-1.5 mb-4 px-0.5" style={{ height: 72 }}>
              {last7Days.map((d) => {
                const barH = Math.max(3, Math.round((d.steps / maxSteps) * 48))
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                    {d.steps > 0 && (
                      <span className="text-[8px] text-gray-400 tabular-nums leading-none">
                        {d.steps >= 1000 ? `${(d.steps / 1000).toFixed(1)}k` : d.steps}
                      </span>
                    )}
                    <div
                      className={`w-full rounded-t-md transition-all ${d.isToday ? 'bg-emerald-500' : 'bg-emerald-200 dark:bg-emerald-800/60'}`}
                      style={{ height: `${barH}px` }}
                    />
                    <span className={`text-[9px] leading-none ${d.isToday ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                      {d.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Date + steps input */}
            <div className="flex gap-2 items-end">
              <div className="flex-none">
                <label className="text-xs text-gray-500 mb-1 block">Datum</label>
                <Input
                  type="date"
                  value={stepDate}
                  onChange={(e) => setStepDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Schritte</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="z.B. 8500"
                  value={stepCount}
                  onChange={(e) => setStepCount(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleAddSteps()}
                />
              </div>
              <Button onClick={handleAddSteps} className="flex-none mb-0.5">Setzen</Button>
            </div>
          </div>
          )}

          {/* ── Aktivitäten ── */}
          {widgets.activities && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-white">Heutige Aktivitäten</span>
                {todayActivities.length > 0 && (
                  <span className="text-xs font-bold bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded-full">
                    {todayActivities.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowActivityModal(true)}
                className="flex items-center gap-1 text-xs font-semibold text-primary-500 hover:text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-2.5 py-1.5 rounded-xl transition-colors"
              >
                <Plus size={14} /> Hinzufügen
              </button>
            </div>
            {todayActivities.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-2xl mb-1">🏃</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Noch keine Aktivität heute</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {todayActivities.map((a) => (
                  <div key={a.id} className="px-2 py-1">
                    <ActivityCard
                      activity={a}
                      onEdit={(act) => { setEditActivity(act); setShowActivityModal(true) }}
                      onDelete={async (id) => { await deleteActivity(id); loadActivities(today) }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

        </div>
      </PageWrapper>

      <Modal
        open={showActivityModal}
        onClose={() => { setShowActivityModal(false); setEditActivity(null) }}
        title={editActivity ? 'Aktivität bearbeiten' : 'Aktivität hinzufügen'}
      >
        <ActivityForm
          initial={editActivity ?? undefined}
          onSave={handleSaveActivity}
          onCancel={() => { setShowActivityModal(false); setEditActivity(null) }}
        />
      </Modal>
    </>
  )
}
