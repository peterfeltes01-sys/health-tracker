import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { WeightEntry } from '../../types'
import { WeightEntryForm } from './WeightEntryForm'
import { WeightTrendChart } from './WeightTrendChart'
import { Card } from '../shared/Card'
import { Modal } from '../shared/Modal'
import { Button } from '../shared/Button'
import { useWeightStore } from '../../stores/weightStore'

export function WeightDashboard() {
  const { entries, upsert, delete: deleteEntry } = useWeightStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<WeightEntry | undefined>()

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted[0]
  const weekAgo = sorted.find((e) => {
    const d = new Date(latest?.date ?? new Date())
    d.setDate(d.getDate() - 7)
    return e.date <= d.toISOString().split('T')[0]
  })

  const diff = latest && weekAgo ? latest.weightKg - weekAgo.weightKg : null

  async function handleSave(entry: Omit<WeightEntry, 'id'>) {
    await upsert(entry)
    setShowForm(false)
    setEditing(undefined)
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Aktuelles Gewicht</p>
              {latest ? (
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {latest.weightKg.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500">kg</span>
                  {diff !== null && (
                    <span className={`text-sm font-semibold ${diff < 0 ? 'text-green-500' : diff > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg vs. letzte Woche
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Noch kein Eintrag</p>
              )}
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Eintrag
            </Button>
          </div>
          <WeightTrendChart entries={entries} />
        </Card>

        {sorted.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Einträge</p>
            {sorted.slice(0, 20).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3"
              >
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{entry.weightKg.toFixed(1)} kg</span>
                    {entry.bodyFatPercent && (
                      <span className="text-xs text-gray-500">{entry.bodyFatPercent.toFixed(1)}% KF</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{entry.date}</p>
                  {entry.notes && <p className="text-xs text-gray-400 italic">{entry.notes}</p>}
                </div>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">⚖️</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Noch keine Gewichtsdaten</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Trage dein erstes Gewicht ein</p>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(undefined) }} title="Gewicht eintragen">
        <WeightEntryForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(undefined) }}
        />
      </Modal>
    </>
  )
}
