import { useState, useEffect } from 'react'
import { Plus, Footprints } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ActivityCard } from '../components/activities/ActivityCard'
import { ActivityForm } from '../components/activities/ActivityForm'
import { HydrationTracker } from '../components/hydration/HydrationTracker'
import { StepInput } from '../components/steps/StepInput'
import { Modal } from '../components/shared/Modal'
import { Button } from '../components/shared/Button'
import { Input } from '../components/shared/Input'
import { useActivitiesStore } from '../stores/activitiesStore'
import { useHydrationStore } from '../stores/hydrationStore'
import { useStepsStore } from '../stores/stepsStore'
import { useSettingsStore } from '../stores/settingsStore'
import { toISODate } from '../utils/calculations'
import { formatSteps } from '../utils/formatters'
import type { Activity } from '../types'

type Tab = 'activities' | 'hydration' | 'steps'

export function Activities() {
  const today = toISODate(new Date())
  const [tab, setTab] = useState<Tab>('activities')
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showStepModal, setShowStepModal] = useState(false)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [manualSteps, setManualSteps] = useState('')

  const { entries: activities, loadByDate: loadActivities, addActivity, updateActivity, deleteActivity } = useActivitiesStore()
  const { entries: hydrationEntries, loadByDate: loadHydration, getTotalForDate: getHydTotal, addHydration, deleteEntry: deleteHydration } = useHydrationStore()
  const { entries: stepEntries, loadByDate: loadSteps, getTotalForDate: getStepTotal, addSteps, addStepsManual, deleteEntry: deleteStep } = useStepsStore()
  const { settings } = useSettingsStore()

  useEffect(() => {
    loadActivities(today)
    loadHydration(today)
    loadSteps(today)
  }, [today])

  const todayActivities = activities.filter((a) => a.date === today)
  const todayHydration = getHydTotal(today)
  const todaySteps = getStepTotal(today)

  async function handleSaveActivity(activity: Activity) {
    if (editActivity) await updateActivity(activity)
    else await addActivity(activity)
    setShowActivityModal(false)
    setEditActivity(null)
  }

  return (
    <>
      <Header title="Aktivitäten" />
      <PageWrapper>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 mb-5">
          {([
            { key: 'activities', label: '🏃 Aktivitäten' },
            { key: 'hydration', label: '💧 Wasser' },
            { key: 'steps', label: '🦶 Schritte' },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                tab === key
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'activities' && (
          <div className="space-y-3">
            <Button fullWidth onClick={() => setShowActivityModal(true)}>
              <Plus size={16} /> Aktivität hinzufügen
            </Button>
            {todayActivities.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                <div className="text-4xl mb-3">🏋️</div>
                <p className="text-sm">Noch keine Aktivitäten heute</p>
              </div>
            ) : (
              todayActivities.map((a) => (
                <ActivityCard
                  key={a.id}
                  activity={a}
                  onEdit={(act) => { setEditActivity(act); setShowActivityModal(true) }}
                  onDelete={deleteActivity}
                />
              ))
            )}
          </div>
        )}

        {tab === 'hydration' && (
          <HydrationTracker
            entries={hydrationEntries.filter((e) => e.date === today)}
            total={todayHydration}
            goal={settings.dailyHydrationGoalMl}
            onAdd={addHydration}
            onDelete={deleteHydration}
          />
        )}

        {tab === 'steps' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-5 text-white text-center">
              <div className="text-5xl font-bold">{formatSteps(todaySteps)}</div>
              <div className="text-primary-200 mt-1">von {formatSteps(settings.dailyStepGoal)} Schritten</div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Schritte manuell eingeben</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="z.B. 3.000"
                  value={manualSteps}
                  onChange={(e) => setManualSteps(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    const n = parseInt(manualSteps)
                    if (n > 0) { addSteps(n, 'manual'); setManualSteps('') }
                  }}
                >
                  +
                </Button>
              </div>
              <button
                onClick={() => setShowStepModal(true)}
                className="flex items-center gap-1.5 text-xs text-primary-500 dark:text-primary-400"
              >
                <Footprints size={13} /> Mit Datum & Uhrzeit hinzufügen
              </button>
            </div>

            <div className="space-y-2">
              {[...stepEntries].filter((e) => e.date === today).reverse().map((entry) => (
                <div key={entry.id} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatSteps(entry.steps)} Schritte</span>
                    <span className="ml-2 text-xs text-gray-400">{entry.source === 'quick_add' ? 'Schnellzugriff' : 'Manuell'}</span>
                  </div>
                  <button
                    onClick={() => deleteStep(entry.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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

      <Modal open={showStepModal} onClose={() => setShowStepModal(false)} title="Schritte hinzufügen">
        <StepInput onAdd={addStepsManual} onClose={() => setShowStepModal(false)} />
      </Modal>
    </>
  )
}
