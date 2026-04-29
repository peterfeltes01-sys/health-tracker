import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { DailyOverview } from '../components/dashboard/DailyOverview'
import { QuickActions } from '../components/dashboard/QuickActions'
import { ActivityCard } from '../components/activities/ActivityCard'
import { ActivityForm } from '../components/activities/ActivityForm'
import { Modal } from '../components/shared/Modal'
import { Card } from '../components/shared/Card'
import { useStepsStore } from '../stores/stepsStore'
import { useActivitiesStore } from '../stores/activitiesStore'
import { useHydrationStore } from '../stores/hydrationStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useNutritionStore } from '../stores/nutritionStore'
import { useWeightStore } from '../stores/weightStore'
import { useBloodPressureStore } from '../stores/bloodPressureStore'
import { toISODate } from '../utils/calculations'
import { BP_CATEGORY_META } from '../lib/bloodPressure'
import type { Activity } from '../types'
import { subDays } from 'date-fns'

export function Dashboard() {
  const today = toISODate(new Date())
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const navigate = useNavigate()

  const { loadByDate: loadSteps, getTotalForDate } = useStepsStore()
  const { entries: activities, loadByDate: loadActivities, addActivity, updateActivity, deleteActivity } = useActivitiesStore()
  const { loadByDate: loadHydration, getTotalForDate: getHydTotal } = useHydrationStore()
  const { settings } = useSettingsStore()
  const { meals, loadMealsByDate } = useNutritionStore()
  const { entries: weightEntries, load: loadWeight } = useWeightStore()
  const { entries: bpEntries, load: loadBP } = useBloodPressureStore()

  useEffect(() => {
    loadSteps(today)
    loadActivities(today)
    loadHydration(today)
    loadMealsByDate(today)
    const from = toISODate(subDays(new Date(), 30))
    loadWeight(from)
    loadBP(from)
  }, [today])

  const todaySteps = getTotalForDate(today)
  const todayHydration = getHydTotal(today)
  const todayActivities = activities.filter((a) => a.date === today)

  // Nutrition widget
  const todayMeals = meals.filter((m) => m.date === today)
  const todayKcal = todayMeals.reduce((sum, m) => sum + m.totals.kcal, 0)
  const kcalGoal = settings.nutritionGoals?.dailyKcal ?? 2000
  const kcalPct = Math.min(100, Math.round((todayKcal / kcalGoal) * 100))

  // Weight widget
  const latestWeight = [...weightEntries].sort((a, b) => b.date.localeCompare(a.date))[0]
  const weekAgoWeight = [...weightEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .find((e) => e.date <= toISODate(subDays(new Date(), 7)))
  const weightDiff = latestWeight && weekAgoWeight
    ? latestWeight.weightKg - weekAgoWeight.weightKg
    : null

  // BP widget
  const latestBP = [...bpEntries].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))[0]
  const bpMeta = latestBP ? BP_CATEGORY_META[latestBP.category] : null

  async function handleSaveActivity(activity: Activity) {
    if (editActivity) {
      await updateActivity(activity)
    } else {
      await addActivity(activity)
    }
    setShowActivityModal(false)
    setEditActivity(null)
    loadActivities(today)
  }

  return (
    <>
      <Header />
      <PageWrapper>
        <div className="space-y-5">
          <DailyOverview
            steps={todaySteps}
            stepGoal={settings.dailyStepGoal}
            hydration={todayHydration}
            hydrationGoal={settings.dailyHydrationGoalMl}
            activities={todayActivities}
          />

          {/* Quick health widgets */}
          <div className="grid grid-cols-2 gap-3">
            {/* kcal widget */}
            <Card
              padding="sm"
              onClick={() => navigate('/nutrition')}
              className="flex flex-col gap-2"
            >
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kalorien heute</p>
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{todayKcal}</span>
                <span className="text-xs text-gray-400 ml-1">/ {kcalGoal} kcal</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${kcalPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{kcalPct}% des Tagesziels</p>
            </Card>

            {/* Weight & BP widget */}
            <div className="space-y-3">
              {latestWeight && (
                <Card padding="sm" onClick={() => navigate('/values')} className="flex flex-col gap-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Gewicht</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{latestWeight.weightKg.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">kg</span>
                    {weightDiff !== null && (
                      <span className={`text-xs font-semibold ml-1 ${weightDiff < 0 ? 'text-green-500' : weightDiff > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)}
                      </span>
                    )}
                  </div>
                </Card>
              )}
              {latestBP && bpMeta && (
                <Card padding="sm" onClick={() => navigate('/values')} className="flex flex-col gap-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Blutdruck</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: bpMeta.color }} />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {latestBP.systolic}/{latestBP.diastolic}
                    </span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: bpMeta.color }}>{bpMeta.label}</p>
                </Card>
              )}
            </div>
          </div>

          <QuickActions onAddActivity={() => setShowActivityModal(true)} />

          {todayActivities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Heutige Aktivitäten</h3>
              {todayActivities.map((a) => (
                <ActivityCard
                  key={a.id}
                  activity={a}
                  onEdit={(act) => { setEditActivity(act); setShowActivityModal(true) }}
                  onDelete={async (id) => { await deleteActivity(id); loadActivities(today) }}
                />
              ))}
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
