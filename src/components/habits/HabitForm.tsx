import { useState } from 'react'
import { Button } from '../shared/Button'
import { Input, Select } from '../shared/Input'
import type { Habit, HabitType, HabitPolarity, HabitFrequency } from '../../types/habits'

export const HABIT_ICONS = [
  '💧','🏃','💪','📚','🧘','😴','🥗','🚭',
  '📵','🍺','💊','🌅','🎯','✍️','🧹','🛁',
  '🌿','🍎','🚶','🎵','🎨','💻','🤸','🧠',
  '⚽','🏊','🚴','🍵','☀️','🌙','📝','⏰',
]

export const HABIT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#f97316', '#06b6d4',
  '#84cc16', '#6366f1', '#14b8a6', '#f43f5e',
]

const DOW_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

interface HabitFormProps {
  initial?: Habit
  onSave: (data: Omit<Habit, 'id' | 'createdAt' | 'archivedAt' | 'order'>) => Promise<void>
  onCancel: () => void
}

export function HabitForm({ initial, onSave, onCancel }: HabitFormProps) {
  const [name, setName]               = useState(initial?.name ?? '')
  const [icon, setIcon]               = useState(initial?.icon ?? '🎯')
  const [color, setColor]             = useState(initial?.color ?? '#3b82f6')
  const [category, setCategory]       = useState(initial?.category ?? '')
  const [type, setType]               = useState<HabitType>(initial?.type ?? 'binary')
  const [targetValue, setTargetValue] = useState(initial?.targetValue?.toString() ?? '')
  const [targetUnit, setTargetUnit]   = useState(initial?.targetUnit ?? '')
  const [polarity, setPolarity]       = useState<HabitPolarity>(initial?.polarity ?? 'positive')
  const [frequency, setFrequency]     = useState<HabitFrequency>(initial?.frequency ?? 'daily')
  const [targetWeekdays, setTargetWeekdays] = useState<number[]>(
    initial?.targetWeekdays ?? [1, 2, 3, 4, 5]
  )
  const [targetCount, setTargetCount] = useState(initial?.targetCount?.toString() ?? '3')
  const [reminderTime, setReminderTime] = useState(initial?.reminderTime ?? '')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  function toggleWeekday(day: number) {
    setTargetWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function handleSave() {
    if (!name.trim()) { setError('Name ist erforderlich'); return }
    if (type === 'quantified' && !targetValue) { setError('Zielwert ist erforderlich'); return }
    if (frequency === 'weekdays' && targetWeekdays.length === 0) {
      setError('Mindestens 1 Wochentag wählen')
      return
    }
    setError('')
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        icon,
        color,
        category: category.trim() || null,
        type,
        targetValue: type === 'quantified' ? parseFloat(targetValue) || null : null,
        targetUnit: type === 'quantified' ? (targetUnit.trim() || null) : null,
        polarity,
        frequency,
        targetWeekdays: frequency === 'weekdays' ? [...targetWeekdays] : null,
        targetCount: ['timesPerWeek', 'timesPerMonth'].includes(frequency)
          ? parseInt(targetCount) || 1
          : null,
        reminderTime: reminderTime || null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="z.B. Wasser trinken"
      />

      {/* Icon */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</p>
        <div className="flex flex-wrap gap-2">
          {HABIT_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(ic)}
              className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${
                icon === ic
                  ? 'ring-2 ring-offset-1 scale-110 bg-gray-50 dark:bg-gray-800'
                  : 'bg-gray-50 dark:bg-gray-800 hover:scale-110'
              }`}
              style={icon === ic ? { outlineColor: color } : undefined}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Farbe</p>
        <div className="flex flex-wrap gap-2">
          {HABIT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-transform ${
                color === c ? 'scale-125' : 'hover:scale-110'
              }`}
              style={{
                backgroundColor: c,
                boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
              }}
            />
          ))}
        </div>
      </div>

      <Input
        label="Kategorie (optional)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="z.B. Gesundheit, Fitness…"
      />

      {/* Type */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Art</p>
        <div className="grid grid-cols-2 gap-2">
          {([['binary', '✓  Erledigt / Ja·Nein'], ['quantified', '#  Mengenziel']] as const).map(
            ([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setType(v)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  type === v
                    ? 'text-white border-transparent'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                }`}
                style={type === v ? { backgroundColor: color } : undefined}
              >
                {l}
              </button>
            )
          )}
        </div>
      </div>

      {type === 'quantified' && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Zielwert"
            type="number"
            min="0"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder="z.B. 2000"
          />
          <Input
            label="Einheit"
            value={targetUnit}
            onChange={(e) => setTargetUnit(e.target.value)}
            placeholder="z.B. ml, min"
          />
        </div>
      )}

      {/* Polarity */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Richtung</p>
        <div className="grid grid-cols-2 gap-2">
          {([['positive', '↑  Aufbauen'], ['negative', '↓  Reduzieren']] as const).map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setPolarity(v)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                polarity === v
                  ? 'text-white border-transparent'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
              }`}
              style={polarity === v ? { backgroundColor: color } : undefined}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <Select
        label="Häufigkeit"
        value={frequency}
        onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
        options={[
          { value: 'daily', label: 'Täglich' },
          { value: 'weekdays', label: 'Bestimmte Wochentage' },
          { value: 'timesPerWeek', label: 'x-mal pro Woche' },
          { value: 'timesPerMonth', label: 'x-mal pro Monat' },
        ]}
      />

      {frequency === 'weekdays' && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Wochentage</p>
          <div className="flex gap-1">
            {DOW_LABELS.map((label, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleWeekday(idx)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  targetWeekdays.includes(idx)
                    ? 'text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}
                style={targetWeekdays.includes(idx) ? { backgroundColor: color } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(frequency === 'timesPerWeek' || frequency === 'timesPerMonth') && (
        <Input
          label={frequency === 'timesPerWeek' ? 'Mal pro Woche' : 'Mal pro Monat'}
          type="number"
          min="1"
          value={targetCount}
          onChange={(e) => setTargetCount(e.target.value)}
        />
      )}

      {/* Reminder */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Erinnerung (optional)
        </p>
        <input
          type="time"
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">
          ⚠️ Erinnerungen benötigen eine geöffnete App oder aktiven Browser-Hintergrund. Ohne
          Backend sind keine zuverlässigen Push-Notifications möglich.
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel} fullWidth>
          Abbrechen
        </Button>
        <Button onClick={handleSave} disabled={saving} fullWidth>
          {saving ? 'Speichern…' : 'Speichern'}
        </Button>
      </div>
    </div>
  )
}
