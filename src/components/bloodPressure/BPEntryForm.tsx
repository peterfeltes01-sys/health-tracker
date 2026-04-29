import { useState } from 'react'
import type { BloodPressureEntry } from '../../types'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { toISODate } from '../../utils/calculations'
import { classifyBP, BP_CATEGORY_META } from '../../lib/bloodPressure'

interface Props {
  initial?: BloodPressureEntry
  onSave: (entry: Omit<BloodPressureEntry, 'id' | 'category'>) => Promise<void>
  onCancel: () => void
}

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function BPEntryForm({ initial, onSave, onCancel }: Props) {
  const [date, setDate] = useState(initial?.date ?? toISODate(new Date()))
  const [time, setTime] = useState(initial?.time ?? nowTime())
  const [sys, setSys] = useState(initial?.systolic.toString() ?? '')
  const [dia, setDia] = useState(initial?.diastolic.toString() ?? '')
  const [pulse, setPulse] = useState(initial?.pulse?.toString() ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)

  const sysNum = parseInt(sys)
  const diaNum = parseInt(dia)
  const canPreview = isFinite(sysNum) && isFinite(diaNum) && sysNum > 0 && diaNum > 0
  const preview = canPreview ? classifyBP(sysNum, diaNum) : null
  const meta = preview ? BP_CATEGORY_META[preview] : null

  async function handleSave() {
    if (!canPreview) return
    setSaving(true)
    try {
      await onSave({
        date,
        time,
        systolic: sysNum,
        diastolic: diaNum,
        pulse: pulse ? parseInt(pulse) || undefined : undefined,
        notes: notes.trim() || undefined,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Datum" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="Uhrzeit" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Systolisch (mmHg) *"
          type="number"
          min="60"
          max="250"
          placeholder="120"
          value={sys}
          onChange={(e) => setSys(e.target.value)}
        />
        <Input
          label="Diastolisch (mmHg) *"
          type="number"
          min="40"
          max="150"
          placeholder="80"
          value={dia}
          onChange={(e) => setDia(e.target.value)}
        />
      </div>

      <Input
        label="Puls (bpm, optional)"
        type="number"
        min="30"
        max="220"
        placeholder="72"
        value={pulse}
        onChange={(e) => setPulse(e.target.value)}
      />

      {meta && (
        <div
          className="flex items-center gap-3 rounded-xl p-3 border"
          style={{ backgroundColor: meta.bg, borderColor: meta.color + '40' }}
        >
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
          <span className="text-sm font-semibold" style={{ color: meta.color }}>{meta.label}</span>
          <span className="text-sm text-gray-600 ml-auto">{sysNum}/{diaNum} mmHg</span>
        </div>
      )}

      <Input
        label="Notiz (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="z.B. nach dem Aufwachen"
      />

      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onCancel}>Abbrechen</Button>
        <Button fullWidth onClick={handleSave} disabled={!canPreview || saving}>
          {saving ? 'Speichern…' : 'Speichern'}
        </Button>
      </div>
    </div>
  )
}
