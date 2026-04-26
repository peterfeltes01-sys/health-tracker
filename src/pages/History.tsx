import { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ActivityCard } from '../components/activities/ActivityCard'
import { ActivityForm } from '../components/activities/ActivityForm'
import { Modal } from '../components/shared/Modal'
import { Select } from '../components/shared/Input'
import { useActivitiesStore } from '../stores/activitiesStore'
import { useStepsStore } from '../stores/stepsStore'
import { ACTIVITIES } from '../utils/constants'
import { toISODate } from '../utils/calculations'
import { formatDate, formatSteps } from '../utils/formatters'
import type { Activity } from '../types'

export function History() {
  const [filterType, setFilterType] = useState('all')
  const [editActivity, setEditActivity] = useState<Activity | null>(null)

  const { entries: activities, loadByRange: loadActivities, updateActivity, deleteActivity } = useActivitiesStore()
  const { entries: steps, loadByRange: loadSteps } = useStepsStore()

  useEffect(() => {
    const from = toISODate(new Date(Date.now() - 90 * 86400000))
    const to = toISODate(new Date())
    loadActivities(from, to)
    loadSteps(from, to)
  }, [])

  const typeOptions = [
    { value: 'all', label: 'Alle Aktivitäten' },
    ...ACTIVITIES.map((a) => ({ value: a.id, label: `${a.icon} ${a.label}` })),
  ]

  const filtered = activities
    .filter((a) => filterType === 'all' || a.activityType === filterType)
    .sort((a, b) => b.date.localeCompare(a.date))

  const grouped = filtered.reduce<Record<string, Activity[]>>((acc, a) => {
    if (!acc[a.date]) acc[a.date] = []
    acc[a.date].push(a)
    return acc
  }, {})

  const stepsByDate = steps.reduce<Record<string, number>>((acc, s) => {
    acc[s.date] = (acc[s.date] ?? 0) + s.steps
    return acc
  }, {})

  return (
    <>
      <Header title="Verlauf" />
      <PageWrapper>
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400 flex-shrink-0" />
            <Select
              value={filterType}
              options={typeOptions}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1"
            />
          </div>

          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm">Keine Einträge gefunden</p>
            </div>
          ) : (
            Object.entries(grouped)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, acts]) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">{formatDate(date)}</h3>
                    {stepsByDate[date] && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        🦶 {formatSteps(stepsByDate[date])}
                      </span>
                    )}
                  </div>
                  {acts.map((a) => (
                    <ActivityCard
                      key={a.id}
                      activity={a}
                      showDate
                      onEdit={(act) => setEditActivity(act)}
                      onDelete={deleteActivity}
                    />
                  ))}
                </div>
              ))
          )}
        </div>
      </PageWrapper>

      {editActivity && (
        <Modal open onClose={() => setEditActivity(null)} title="Aktivität bearbeiten">
          <ActivityForm
            initial={editActivity}
            onSave={async (a) => { await updateActivity(a); setEditActivity(null) }}
            onCancel={() => setEditActivity(null)}
          />
        </Modal>
      )}
    </>
  )
}
