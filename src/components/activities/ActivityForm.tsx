import { useState, useEffect } from 'react'
import type { Activity } from '../../types'
import { ACTIVITIES, BIKE_TYPES, PACE_ACTIVITIES } from '../../utils/constants'
import { estimateCalories, generateId, findSimilarActivity, toISODate } from '../../utils/calculations'
import { calcAvgSpeed, formatSpeed, calcPace, formatPace } from '../../utils/formatters'
import { Input, Select } from '../shared/Input'
import { Button } from '../shared/Button'
import { useSettingsStore } from '../../stores/settingsStore'

interface ActivityFormProps {
  initial?: Activity
  onSave: (activity: Activity) => Promise<void>
  onCancel: () => void
}

const intensityOptions = [
  { value: 'low', label: 'Niedrig' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' },
]

export function ActivityForm({ initial, onSave, onCancel }: ActivityFormProps) {
  const customActivities = useSettingsStore((s) => s.settings.customActivities)
  const allActivities = [...ACTIVITIES, ...customActivities.map(ca => ({ ...ca, category: 'custom' as const }))]

  const [activityType, setActivityType] = useState(initial?.activityType ?? 'walk')
  const [customName, setCustomName] = useState(initial?.customName ?? '')
  const [customSearch, setCustomSearch] = useState('')
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [date, setDate] = useState(initial?.date ?? toISODate(new Date()))
  const [startTime, setStartTime] = useState(initial?.startTime ?? '')
  const [duration, setDuration] = useState(initial?.durationMinutes?.toString() ?? '')
  const [distance, setDistance] = useState(initial?.distanceKm?.toString() ?? '')
  const [wattage, setWattage] = useState(initial?.wattage?.toString() ?? '')
  const [elevationGain, setElevationGain] = useState(initial?.elevationGain?.toString() ?? '')
  const [bikeType, setBikeType] = useState<Activity['bikeType']>(initial?.bikeType)
  const [calories, setCalories] = useState(initial?.calories?.toString() ?? '')
  const [caloriesManual, setCaloriesManual] = useState(!initial?.caloriesEstimated)
  const [intensity, setIntensity] = useState<Activity['intensity']>(initial?.intensity ?? 'medium')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const selected = allActivities.find((a) => a.id === activityType)
  const isBikeOutdoor = activityType === 'bike_outdoor'
  const hasPace = PACE_ACTIVITIES.includes(activityType)

  const distVal = parseFloat(distance)
  const durVal = parseInt(duration)

  const avgSpeed = isBikeOutdoor && distVal > 0 && durVal > 0
    ? calcAvgSpeed(distVal, durVal)
    : null

  const pace = hasPace && distVal > 0 && durVal > 0
    ? calcPace(durVal, distVal)
    : null

  useEffect(() => {
    if (!caloriesManual && duration && selected) {
      const est = estimateCalories(parseInt(duration) || 0, selected.defaultCalPerMin, intensity)
      setCalories(est.toString())
    }
  }, [duration, intensity, activityType, caloriesManual, selected])

  function handleTypeChange(id: string) {
    setActivityType(id)
    setCustomName('')
    setSuggestion(null)
    setCustomSearch('')
  }

  function handleCustomSearch(val: string) {
    setCustomSearch(val)
    if (val.length < 2) { setSuggestion(null); return }
    const match = findSimilarActivity(allActivities, val)
    setSuggestion(match ? match.id : null)
    if (!match) setActivityType('other')
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!activityType) e.activityType = 'Pflichtfeld'
    if (!duration || parseInt(duration) < 1) e.duration = 'Mindestens 1 Minute'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    const activity: Activity = {
      id: initial?.id ?? generateId(),
      activityType,
      customName: activityType === 'other' && customSearch ? customSearch : customName || undefined,
      date,
      startTime: startTime || undefined,
      durationMinutes: parseInt(duration),
      distanceKm: distance ? parseFloat(distance) : undefined,
      wattage: wattage ? parseInt(wattage) : undefined,
      elevationGain: isBikeOutdoor && elevationGain ? parseInt(elevationGain) : undefined,
      bikeType: isBikeOutdoor && bikeType ? bikeType : undefined,
      calories: calories ? parseFloat(calories) : undefined,
      caloriesEstimated: !caloriesManual,
      intensity,
      notes: notes || undefined,
      timestamp: initial?.timestamp ?? new Date().toISOString(),
    }
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(activity)
    } catch {
      setSaveError('Speichern fehlgeschlagen. Bitte erneut versuchen.')
      setSaving(false)
    }
  }

  const activityOptions = allActivities.map((a) => ({ value: a.id, label: `${a.icon} ${a.label}` }))
  const bikeTypeOptions = BIKE_TYPES.map((b) => ({ value: b.value, label: b.label }))

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Select
          label="Aktivitätsart"
          value={activityType}
          options={activityOptions}
          onChange={(e) => handleTypeChange(e.target.value)}
          error={errors.activityType}
        />

        {activityType === 'other' && (
          <div className="space-y-2">
            <Input
              label="Name eingeben"
              value={customSearch || customName}
              onChange={(e) => {
                setCustomName(e.target.value)
                handleCustomSearch(e.target.value)
              }}
              placeholder="z.B. Tischtennis"
            />
            {suggestion && (
              <div className="bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 rounded-xl p-3 text-sm">
                <span className="text-primary-700 dark:text-primary-400">Meintest du: </span>
                <button
                  className="font-semibold text-primary-600 underline"
                  onClick={() => { setActivityType(suggestion); setSuggestion(null); setCustomSearch('') }}
                >
                  {allActivities.find(a => a.id === suggestion)?.label}
                </button>
                ?
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Datum" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="Startzeit" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      </div>

      <Input
        label="Dauer (Minuten) *"
        type="number"
        min="1"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        error={errors.duration}
        placeholder="z.B. 45"
      />

      {selected?.hasDistance && (
        <div className="space-y-2">
          <Input
            label="Distanz (km)"
            type="number"
            min="0"
            step="0.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="z.B. 5.5"
          />
          {avgSpeed !== null && (
            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900 rounded-xl px-3 py-2">
              <span className="text-base">🏎️</span>
              <span className="text-sm text-orange-700 dark:text-orange-400">
                Ø Geschwindigkeit: <strong>{formatSpeed(avgSpeed)}</strong>
              </span>
            </div>
          )}
          {pace !== null && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl px-3 py-2">
              <span className="text-base">⏱️</span>
              <span className="text-sm text-red-700 dark:text-red-400">
                Pace: <strong>{formatPace(pace)}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {isBikeOutdoor && (
        <>
          <Input
            label="Höhenmeter (m)"
            type="number"
            min="0"
            step="10"
            value={elevationGain}
            onChange={(e) => setElevationGain(e.target.value)}
            placeholder="z.B. 450"
          />
          <Select
            label="Fahrradtyp"
            value={bikeType ?? ''}
            options={bikeTypeOptions}
            onChange={(e) => setBikeType(e.target.value as Activity['bikeType'] || undefined)}
          />
        </>
      )}

      {('hasWattage' in (selected ?? {}) && (selected as any).hasWattage) && (
        <Input
          label="Durchschnittsleistung (Watt)"
          type="number"
          min="0"
          step="1"
          value={wattage}
          onChange={(e) => setWattage(e.target.value)}
          placeholder="z.B. 180"
          hint="Optional — z.B. vom Powermeter oder Heimtrainer"
        />
      )}

      <Select
        label="Intensität"
        value={intensity}
        options={intensityOptions}
        onChange={(e) => setIntensity(e.target.value as Activity['intensity'])}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kalorien (kcal)</label>
          <button
            type="button"
            onClick={() => setCaloriesManual(!caloriesManual)}
            className="text-xs text-primary-600 dark:text-primary-400"
          >
            {caloriesManual ? 'Automatisch berechnen' : 'Manuell eingeben'}
          </button>
        </div>
        <Input
          type="number"
          min="0"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          disabled={!caloriesManual}
          hint={!caloriesManual ? 'Automatisch berechnet' : undefined}
        />
      </div>

      <Input
        label="Notizen"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional..."
      />

      {saveError && (
        <p className="text-sm text-red-500 text-center">{saveError}</p>
      )}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" fullWidth onClick={onCancel} disabled={saving}>Abbrechen</Button>
        <Button fullWidth onClick={handleSubmit} disabled={saving}>
          {saving ? 'Wird gespeichert…' : initial ? 'Speichern' : 'Hinzufügen'}
        </Button>
      </div>
    </div>
  )
}
