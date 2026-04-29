import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { BloodPressureEntry } from '../../types'
import { BPEntryForm } from './BPEntryForm'
import { BPList } from './BPList'
import { BPTrendChart } from './BPTrendChart'
import { Card } from '../shared/Card'
import { Modal } from '../shared/Modal'
import { Button } from '../shared/Button'
import { useBloodPressureStore } from '../../stores/bloodPressureStore'
import { BP_CATEGORY_META } from '../../lib/bloodPressure'

export function BPDashboard() {
  const { entries, add, update, delete: deleteEntry } = useBloodPressureStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<BloodPressureEntry | undefined>()

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
  const latest = sorted[0]
  const latestMeta = latest ? BP_CATEGORY_META[latest.category] : null

  async function handleSave(entry: Omit<BloodPressureEntry, 'id' | 'category'>) {
    if (editing) {
      await update({ ...editing, ...entry, category: editing.category })
    } else {
      await add(entry)
    }
    setShowForm(false)
    setEditing(undefined)
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Letzte Messung</p>
              {latest ? (
                <div className="mt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {latest.systolic}/{latest.diastolic}
                    </span>
                    <span className="text-sm text-gray-500">mmHg</span>
                    {latest.pulse && <span className="text-sm text-gray-400">{latest.pulse} bpm</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: latestMeta?.color }} />
                    <span className="text-sm font-medium" style={{ color: latestMeta?.color }}>
                      {latestMeta?.label}
                    </span>
                    <span className="text-xs text-gray-400">{latest.date} {latest.time}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Noch keine Messung</p>
              )}
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Messen
            </Button>
          </div>

          <BPTrendChart entries={entries} />
        </Card>

        <BPList
          entries={entries.slice(-60)}
          onEdit={(entry) => { setEditing(entry); setShowForm(true) }}
          onDelete={deleteEntry}
        />
      </div>

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(undefined) }}
        title={editing ? 'Messung bearbeiten' : 'Blutdruck messen'}
      >
        <BPEntryForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(undefined) }}
        />
      </Modal>
    </>
  )
}
