import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { WeeklyView } from '../components/stats/WeeklyView'
import { WeeklyGoals } from '../components/stats/WeeklyGoals'
import { ActivityPieChart } from '../components/stats/ActivityPieChart'
import { MonthlyHeatmap } from '../components/stats/MonthlyHeatmap'
import { useStepsStore } from '../stores/stepsStore'
import { useActivitiesStore } from '../stores/activitiesStore'
import { useHydrationStore } from '../stores/hydrationStore'
import { useSettingsStore } from '../stores/settingsStore'
import { toISODate } from '../utils/calculations'
import { getWeekRange } from '../utils/formatters'

export function Stats() {
  const [weekOffset, setWeekOffset] = useState(0)

  const { entries: steps, loadByRange: loadSteps } = useStepsStore()
  const { entries: activities, loadByRange: loadActivities } = useActivitiesStore()
  const { entries: hydration, loadByRange: loadHydration } = useHydrationStore()
  const { settings } = useSettingsStore()

  const week = getWeekRange(weekOffset)

  useEffect(() => {
    const monthStart = toISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    const farBack = week.from < monthStart ? week.from : monthStart
    const today = toISODate(new Date())
    loadSteps(farBack, today)
    loadActivities(farBack, today)
    loadHydration(farBack, today)
  }, [weekOffset])

  const weekActivities = activities.filter((a) => a.date >= week.from && a.date <= week.to)
  const weekSteps = steps.filter((s) => s.date >= week.from && s.date <= week.to)
  const weekHydration = hydration.filter((h) => h.date >= week.from && h.date <= week.to)

  const monthStart = toISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const today = toISODate(new Date())
  const monthActivities = activities.filter((a) => a.date >= monthStart && a.date <= today)
  const monthSteps = steps.filter((s) => s.date >= monthStart && s.date <= today)

  return (
    <>
      <Header title="Statistiken" />
      <PageWrapper>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white">{week.label}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {week.from} – {week.to}
              </div>
            </div>
            <button
              onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
              disabled={weekOffset >= 0}
              className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <ActivityPieChart activities={monthActivities} />

          <WeeklyGoals
            activities={weekActivities}
            actGoal={settings.weeklyActivityGoal ?? 5}
          />

          <WeeklyView
            from={week.from}
            to={week.to}
            steps={weekSteps}
            activities={weekActivities}
            hydration={weekHydration}
            stepGoal={settings.dailyStepGoal}
            hydrationGoal={settings.dailyHydrationGoalMl}
          />

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Monat im Überblick</h2>
            <MonthlyHeatmap
              steps={monthSteps}
              activities={monthActivities}
              stepGoal={settings.dailyStepGoal}
            />
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Monats-Zusammenfassung</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Aktivitäten',
                  value: monthActivities.length,
                  unit: '',
                  icon: '🏃',
                  color: 'text-primary-600 dark:text-primary-400',
                },
                {
                  label: 'Akt. Minuten',
                  value: monthActivities.reduce((s, a) => s + a.durationMinutes, 0),
                  unit: ' min',
                  icon: '⏱️',
                  color: 'text-blue-600 dark:text-blue-400',
                },
                {
                  label: 'Verbrannte kcal',
                  value: Math.round(monthActivities.reduce((s, a) => s + (a.calories ?? 0), 0)).toLocaleString('de-DE'),
                  unit: '',
                  icon: '🔥',
                  color: 'text-accent-500',
                },
                {
                  label: 'Gesamte Schritte',
                  value: monthSteps.reduce((s, e) => s + e.steps, 0).toLocaleString('de-DE'),
                  unit: '',
                  icon: '🦶',
                  color: 'text-gray-700 dark:text-gray-300',
                },
              ].map(({ label, value, unit, icon, color }) => (
                <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className={`text-xl font-bold ${color}`}>{value}{unit}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </PageWrapper>
    </>
  )
}
