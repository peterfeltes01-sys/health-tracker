import { useState } from 'react'
import { Smartphone, Check } from 'lucide-react'
import { useStepsStore } from '../../stores/stepsStore'
import { Modal } from '../shared/Modal'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatSteps } from '../../utils/formatters'
import { toISODate } from '../../utils/calculations'

interface Props {
  date: string
  todaySteps: number
}

export function StepsSyncTile({ date, todaySteps }: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const setTotalForDate = useStepsStore((s) => s.setTotalForDate)
  const stepGoal = useSettingsStore((s) => s.settings.dailyStepGoal)

  const isToday = date === toISODate(new Date())
  const reached = todaySteps >= stepGoal

  function handleOpen() {
    setValue(todaySteps > 0 ? String(todaySteps) : '')
    setError('')
    setOpen(true)
  }

  async function handleSubmit() {
    const n = parseInt(value, 10)
    if (!Number.isFinite(n) || n < 0) {
      setError('Bitte eine gültige Schrittzahl eingeben')
      return
    }
    await setTotalForDate(n, date, 'manual')
    setSavedAt(Date.now())
    setOpen(false)
    setTimeout(() => setSavedAt(null), 1800)
  }

  const justSaved = savedAt !== null

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 text-left active:scale-[0.99] transition-transform shadow-sm"
      >
        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center flex-shrink-0">
          {justSaved ? (
            <Check size={18} className="text-green-500" />
          ) : (
            <Smartphone size={18} className="text-primary-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {isToday ? 'Schritte vom Handy' : 'Schritte erfassen'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {todaySteps > 0
              ? `${formatSteps(todaySteps)} gespeichert${reached ? ' · Ziel erreicht 🎉' : ''}`
              : 'Tippe, um die aktuelle Zahl zu übernehmen'}
          </p>
        </div>
        <span className="text-xs font-medium text-primary-500 flex-shrink-0">
          {todaySteps > 0 ? 'Aktualisieren' : 'Übernehmen'}
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Schritte aus Handy übernehmen">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Öffne deine Health-/Fitness-App auf dem Handy und trage die aktuelle Schrittzahl für{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {isToday ? 'heute' : new Date(date).toLocaleDateString('de-DE')}
            </span>{' '}
            ein. Der Wert ersetzt den bisher gespeicherten Tagesstand.
          </p>
          <Input
            label="Aktuelle Schrittzahl"
            type="number"
            inputMode="numeric"
            min="0"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError('') }}
            error={error}
            placeholder="z.B. 8420"
            autoFocus
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button fullWidth onClick={handleSubmit}>Speichern</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
