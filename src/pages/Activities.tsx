import { useState, useEffect } from 'react'
import { Plus, History } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ActivityCard } from '../components/activities/ActivityCard'
import { ActivityForm } from '../components/activities/ActivityForm'
import { Modal } from '../components/shared/Modal'
import { Button } from '../components/shared/Button'
import { useActivitiesStore } from '../stores/activitiesStore'
import { toISODate } from '../utils/calculations'
import type { Activity } from '../types'

export function Activities() {
  const today = toISODate(new Date())
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)

  const { entries: activities, loadByDate, addActivity, updateActivity, deleteActivity } = useActivitiesStore()

  useEffect(() => {
    loadByDate(today)
  }, [today])

  const todayActivities = activities.filter((a) => a.date === today)

  async function handleSave(activity: Activity) {
    if (editActivity) await updateActivity(activity)
    else await addActivity(activity)
    setShowModal(false)
    setEditActivity(null)
  }

  return (
    <>
      <Header title="Aktivitäten" />
      <PageWrapper>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button fullWidth onClick={() => setShowModal(true)}>
              <Plus size={16} /> Aktivität hinzufügen
            </Button>
            <Button variant="secondary" onClick={() => navigate('/history')} className="flex-shrink-0 flex items-center gap-1.5">
              <History size={16} /> Verlauf
            </Button>
          </div>

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
                onEdit={(act) => { setEditActivity(act); setShowModal(true) }}
                onDelete={deleteActivity}
              />
            ))
          )}
        </div>
      </PageWrapper>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditActivity(null) }}
        title={editActivity ? 'Aktivität bearbeiten' : 'Aktivität hinzufügen'}
      >
        <ActivityForm
          initial={editActivity ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowModal(false); setEditActivity(null) }}
        />
      </Modal>
    </>
  )
}
