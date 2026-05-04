import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import type { CholesterolEntry } from '../../types'
import { useCholesterolStore } from '../../stores/cholesterolStore'
import { Card } from '../shared/Card'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { Modal } from '../shared/Modal'
import { toISODate } from '../../utils/calculations'
import { formatDate } from '../../utils/formatters'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

function totalCategory(v: number) {
  if (v < 200) return { label: 'Optimal', color: '#22c55e' }
  if (v < 240) return { label: 'Grenzwertig', color: '#f59e0b' }
  return { label: 'Hoch', color: '#ef4444' }
}
function ldlCategory(v: number) {
  if (v < 100) return { label: 'Optimal', color: '#22c55e' }
  if (v < 130) return { label: 'Nahezu optimal', color: '#84cc16' }
  if (v < 160) return { label: 'Grenzwertig', color: '#f59e0b' }
  return { label: 'Erhöht', color: '#ef4444' }
}
function hdlCategory(v: number) {
  if (v >= 60) return { label: 'Gut', color: '#22c55e' }
  if (v >= 40) return { label: 'Ausreichend', color: '#f59e0b' }
  return { label: 'Niedrig', color: '#ef4444' }
}

const EMPTY_FORM = { date: toISODate(new Date()), total: '', ldl: '', hdl: '', triglycerides: '', notes: '' }

export function CholesterolDashboard() {
  const { entries, add, delete: deleteEntry } = useCholesterolStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted[0]

  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: format(parseISO(e.date), 'd. MMM', { locale: de }),
      total: e.totalMgDl ?? null,
      ldl: e.ldlMgDl ?? null,
      hdl: e.hdlMgDl ?? null,
    }))

  async function handleSave() {
    const entry: Omit<CholesterolEntry, 'id'> = {
      date: form.date,
      totalMgDl:       form.total       ? parseFloat(form.total)       : undefined,
      ldlMgDl:         form.ldl         ? parseFloat(form.ldl)         : undefined,
      hdlMgDl:         form.hdl         ? parseFloat(form.hdl)         : undefined,
      triglyceridesMgDl: form.triglycerides ? parseFloat(form.triglycerides) : undefined,
      notes:           form.notes       || undefined,
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
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-400">{formatDate(latest.date)}</p>
                  <div className="flex flex-wrap gap-3">
                    {latest.totalMgDl !== undefined && (
                      <div>
                        <span className="text-2xl font-bold" style={{ color: totalCategory(latest.totalMgDl).color }}>
                          {latest.totalMgDl}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">Gesamt mg/dL</span>
                        <p className="text-xs font-medium mt-0.5" style={{ color: totalCategory(latest.totalMgDl).color }}>
                          {totalCategory(latest.totalMgDl).label}
                        </p>
                      </div>
                    )}
                    {latest.ldlMgDl !== undefined && (
                      <div>
                        <span className="text-2xl font-bold" style={{ color: ldlCategory(latest.ldlMgDl).color }}>
                          {latest.ldlMgDl}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">LDL mg/dL</span>
                        <p className="text-xs font-medium mt-0.5" style={{ color: ldlCategory(latest.ldlMgDl).color }}>
                          {ldlCategory(latest.ldlMgDl).label}
                        </p>
                      </div>
                    )}
                    {latest.hdlMgDl !== undefined && (
                      <div>
                        <span className="text-2xl font-bold" style={{ color: hdlCategory(latest.hdlMgDl).color }}>
                          {latest.hdlMgDl}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">HDL mg/dL</span>
                        <p className="text-xs font-medium mt-0.5" style={{ color: hdlCategory(latest.hdlMgDl).color }}>
                          {hdlCategory(latest.hdlMgDl).label}
                        </p>
                      </div>
                    )}
                    {latest.triglyceridesMgDl !== undefined && (
                      <div>
                        <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                          {latest.triglyceridesMgDl}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">Triglyzeride mg/dL</span>
                      </div>
                    )}
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

          {/* Trend chart */}
          {entries.length > 1 && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-2">Entwicklung (mg/dL)</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v, name) => [`${v} mg/dL`, String(name)]} />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" dot={{ r: 2 }} strokeWidth={2} name="Gesamt" connectNulls />
                  <Line type="monotone" dataKey="ldl" stroke="#ef4444" dot={{ r: 2 }} strokeWidth={2} name="LDL" connectNulls />
                  <Line type="monotone" dataKey="hdl" stroke="#22c55e" dot={{ r: 2 }} strokeWidth={2} name="HDL" connectNulls />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />Gesamt</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block rounded" />LDL</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block rounded" />HDL</span>
              </div>
            </div>
          )}
        </Card>

        {sorted.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Verlauf</p>
            {sorted.slice(0, 20).map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">{formatDate(entry.date)}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {entry.totalMgDl        !== undefined && <span className="font-medium text-blue-600 dark:text-blue-400">Gesamt: {entry.totalMgDl} mg/dL</span>}
                    {entry.ldlMgDl          !== undefined && <span className="font-medium text-red-500">LDL: {entry.ldlMgDl} mg/dL</span>}
                    {entry.hdlMgDl          !== undefined && <span className="font-medium text-green-500">HDL: {entry.hdlMgDl} mg/dL</span>}
                    {entry.triglyceridesMgDl !== undefined && <span className="font-medium text-gray-600 dark:text-gray-400">Tri: {entry.triglyceridesMgDl} mg/dL</span>}
                  </div>
                  {entry.notes && <p className="text-xs text-gray-400 italic mt-0.5">{entry.notes}</p>}
                </div>
                <button onClick={() => deleteEntry(entry.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🩸</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Noch keine Cholesterin-Daten</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Trage deine ersten Werte ein</p>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setForm(EMPTY_FORM) }} title="Cholesterin eintragen">
        <div className="space-y-3">
          <Input label="Datum" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Gesamt (mg/dL)" type="number" placeholder="z.B. 195" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
            <Input label="LDL (mg/dL)" type="number" placeholder="z.B. 115" value={form.ldl} onChange={(e) => setForm({ ...form, ldl: e.target.value })} />
            <Input label="HDL (mg/dL)" type="number" placeholder="z.B. 55" value={form.hdl} onChange={(e) => setForm({ ...form, hdl: e.target.value })} />
            <Input label="Triglyzeride (mg/dL)" type="number" placeholder="z.B. 140" value={form.triglycerides} onChange={(e) => setForm({ ...form, triglycerides: e.target.value })} />
          </div>
          <Input label="Notiz (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="z.B. nüchtern gemessen" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>Abbrechen</Button>
            <Button fullWidth onClick={handleSave} disabled={saving || (!form.total && !form.ldl && !form.hdl)}>
              {saving ? 'Speichern…' : 'Speichern'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
