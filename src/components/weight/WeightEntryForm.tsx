import { useState } from 'react'
import type { WeightEntry } from '../../types'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { toISODate } from '../../utils/calculations'

interface Props {
  initial?: WeightEntry
  onSave: (entry: Omit<WeightEntry, 'id'>) => Promise<void>
  onCancel: () => void
}

export function WeightEntryForm({ initial, onSave, onCancel }: Props) {
  const [date, setDate] = useState(initial?.date ?? toISODate(new Date()))
  const [weight, setWeight] = useState(initial?.weightKg.toString() ?? '')
  const [bodyFat, setBodyFat] = useState(initial?.bodyFatPercent?.toString() ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const w = parseFloat(weight)
    if (!isFinite(w) || w <= 0) return
    setSaving(true)
    try {
      await onSave({
        date,
        weightKg: w,
        bodyFatPercent: bodyFat ? parseFloat(bodyFat) || undefined : undefined,
        notes: notes.trim() || undefined,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input label="Datum" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input
        label="Gewicht (kg) *"
        type="number"
        step="0.1"
        min="20"
        max="300"
        placeholder="75.4"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />
      <Input
        label="Körperfett (%, optional)"
        type="number"
        step="0.1"
        min="1"
        max="70"
        placeholder="18.5"
        value={bodyFat}
        onChange={(e) => setBodyFat(e.target.value)}
      />
      <Input
        label="Notiz (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="z.B. nach dem Sport"
      />
      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onCancel}>Abbrechen</Button>
        <Button fullWidth onClick={handleSave} disabled={!weight || saving}>
          {saving ? 'Speichern…' : 'Speichern'}
        </Button>
      </div>
    </div>
  )
}
