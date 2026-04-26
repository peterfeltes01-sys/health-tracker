import { useState, useEffect } from 'react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { DailyOverview } from '../components/dashboard/DailyOverview'
import { QuickActions } from '../components/dashboard/QuickActions'
import { ActivityCard } from '../components/activities/ActivityCard'
import { ActivityForm } from '../components/activities/ActivityForm'
import { Modal } from '../components/shared/Modal'
import { useStepsStore } from '../stores/stepsStore'
import { useActivitiesStore } from '../stores/activitiesStore'
import { useHydrationStore } from '../stores/hydrationStore'
import { useSettingsStore } from '../stores/settingsStore'
import { toISODate } from '../utils/calculations'
import type { Activity } from '../types'

export function Dashboard() {
  const today = toISODate(new Date())
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)

  const { loadByDate: loadSteps, getTotalForDate } = useStepsStore()
  const { entries: activities, loadByDate: loadActivities, addActivity, updateActivity, deleteActivity } = useActivitiesStore()
  const { loadByDate: loadHydration, getTotalForDate: getHydTotal } = useHydrationStore()
  const { settings } = useSettingsStore()

  useEffect(() => {
    loadSteps(today)
    loadActivities(today)
    loadHydration(today)
  }, [today])

  const todaySteps = getTotalForDate(today)
  const todayHydration = getHydTotal(today)
  const todayActivities = activities.filter((a) => a.date === today)

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
