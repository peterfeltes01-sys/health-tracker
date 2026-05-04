import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import type { BloodSugarEntry, BloodSugarMeasurementType } from '../../types'
import { useBloodSugarStore } from '../../stores/bloodSugarStore'
import { Card } from '../shared/Card'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { Modal } from '../shared/Modal'
import { toISODate } from '../../utils/calculations'
import { formatDate } from '../../utils/formatters'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

const MEASUREMENT_TYPE_LABELS: Record<BloodSugarMeasurementType, string> = {
  fasting:      'Nüchtern',
  postprandial: 'Nach dem Essen',
  random:       'Zufallsmessung',
}

function bloodSugarCategory(value: number, type: BloodSugarMeasurementType) {
  if (type === 'fasting') {
    if (value < 100) return { label: 'Normal', color: '#22c55e' }
    if (value < 126) return { label: 'Prädiabetes', color: '#f59e0b' }
    return { label: 'Erhöht', color: '#ef4444' }
  }
  if (value < 140) return { label: 'Normal', color: '#22c55e' }
  if (value < 200) return { label: 'Erhöht', color: '#f59e0b' }
  return { label: 'Hoch', color: '#ef4444' }
}

const EMPTY_FORM = { date: toISODate(new Date()), value: '', type: 'fasting' as BloodSugarMeasurementType, notes: '' }

export function BloodSugarDashboard() {
  const { entries, add, delete: deleteEntry } = useBloodSugarStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted[0]
  const latestCat = latest ? bloodSugarCategory(latest.valueMgDl, latest.measurementType) : null

  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date:    format(parseISO(e.date), 'd. MMM', { locale: de }),
      value:   e.valueMgDl,
      type:    e.measurementType,
    }))

  async function handleSave() {
    if (!form.value) return
    const entry: Omit<BloodSugarEntry, 'id'> = {
      date:            form.date,
      valueMgDl:       parseFloat(form.value),
      measurementType: form.type,
      notes:           form.notes || undefined,
      timestamp:       new Date().toISOString(),
    }
    setSaving(true)
    await add(entry)
    setSaving(false)
    setShowForm(false)
    setForm(EMPTY_FORM)
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
                    <span className="text-3xl font-bold" style={{ color: latestCat?.color }}>
                      {latest.valueMgDl}
                    </span>
                    <span className="text-sm text-gray-500">mg/dL</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: latestCat?.color }} />
                    <span className="text-sm font-medium" style={{ color: latestCat?.color }}>
                      {latestCat?.label}
                    </span>
                    <span className="text-xs text-gray-400">· {MEASUREMENT_TYPE_LABELS[latest.measurementType]}</span>
                    <span className="text-xs text-gray-400">· {formatDate(latest.date)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Noch keine Messung</p>
              )}
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Eintrag
            </Button>
          </div>

          {/* Reference values */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-1 mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Referenzwerte (mg/dL)</p>
            <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-600 dark:text-gray-400">
              <span className="text-green-600 dark:text-green-400">Nüchtern &lt;100 normal</span>
              <span className="text-yellow-600 dark:text-yellow-400">Nüchtern 100–125 Prä</span>
              <span className="text-green-600 dark:text-green-400">Nach Essen &lt;140 normal</span>
              <span className="text-yellow-600 dark:text-yellow-400">Nach Essen 140–199 erhöht</span>
            </div>
          </div>

          {/* Trend chart */}
          {entries.length > 1 && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-2">Entwicklung (mg/dL)</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${v} mg/dL`]} />
                  <Line type="monotone" dataKey="value" stroke="#f97316" dot={{ r: 2, fill: '#f97316' }} strokeWidth={2} name="Blutzucker" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {sorted.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Verlauf</p>
            {sorted.slice(0, 20).map((entry) => {
              const cat = bloodSugarCategory(entry.valueMgDl, entry.measurementType)
              return (
                <div key={entry.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{entry.valueMgDl} mg/dL</span>
                      <span className="text-xs font-medium" style={{ color: cat.color }}>{cat.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {MEASUREMENT_TYPE_LABELS[entry.measurementType]} · {formatDate(entry.date)}
                    </p>
                    {entry.notes && <p className="text-xs text-gray-400 italic">{entry.notes}</p>}
                  </div>
                  <button onClick={() => deleteEntry(entry.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🍬</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Noch keine Blutzucker-Daten</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Trage deinen ersten Wert ein</p>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setForm(EMPTY_FORM) }} title="Blutzucker eintragen">
        <div className="space-y-3">
          <Input label="Datum" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Wert (mg/dL)" type="number" placeholder="z.B. 95" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Messtyp</label>
            <div className="flex gap-2">
              {(Object.entries(MEASUREMENT_TYPE_LABELS) as [BloodSugarMeasurementType, string][]).map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium border transition-all ${
                    form.type === t
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Input label="Notiz (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="z.B. nach dem Frühstück" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>Abbrechen</Button>
            <Button fullWidth onClick={handleSave} disabled={saving || !form.value}>
              {saving ? 'Speichern…' : 'Speichern'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
