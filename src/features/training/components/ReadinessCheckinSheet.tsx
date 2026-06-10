import { useState } from 'react'
import { X, Moon, Zap, Activity } from 'lucide-react'
import type { ReadinessBand } from '../../../types/training'

interface CheckinValues {
  sleep?: number
  energy?: number
  soreness?: number
}

interface ReadinessCheckinSheetProps {
  onComplete: (values: CheckinValues | null) => void
}

const BAND_COLORS: Record<ReadinessBand, string> = {
  FULL: 'text-green-600 dark:text-green-400',
  REDUCED: 'text-amber-600 dark:text-amber-400',
  RECOVERY: 'text-red-600 dark:text-red-400',
}

const BAND_LABELS: Record<ReadinessBand, string> = {
  FULL: 'Heute wie geplant',
  REDUCED: 'Volumen reduzieren',
  RECOVERY: 'Aktive Erholung',
}

function ScalePicker({
  label,
  icon,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string
  icon: React.ReactNode
  value: number | undefined
  onChange: (v: number) => void
  lowLabel: string
  highLabel: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-gray-500 dark:text-gray-400">{icon}</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              value === n
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 px-1">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}

export function ReadinessCheckinSheet({ onComplete }: ReadinessCheckinSheetProps) {
  const [values, setValues] = useState<CheckinValues>({})

  const set = (key: keyof CheckinValues) => (v: number) =>
    setValues((prev) => ({ ...prev, [key]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-8 shadow-2xl">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6" />

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Wie fühlst du dich?</h2>
            <p className="text-xs text-gray-400 mt-0.5">Optional — du kannst das auch überspringen</p>
          </div>
          <button
            onClick={() => onComplete(null)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <ScalePicker
            label="Schlafqualität"
            icon={<Moon size={16} />}
            value={values.sleep}
            onChange={set('sleep')}
            lowLabel="Schlecht"
            highLabel="Super"
          />
          <ScalePicker
            label="Energielevel"
            icon={<Zap size={16} />}
            value={values.energy}
            onChange={set('energy')}
            lowLabel="Erschöpft"
            highLabel="Voller Energie"
          />
          <ScalePicker
            label="Muskelkater"
            icon={<Activity size={16} />}
            value={values.soreness}
            onChange={set('soreness')}
            lowLabel="Keiner"
            highLabel="Stark"
          />
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => onComplete(null)}
            className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
          >
            Überspringen
          </button>
          <button
            onClick={() => onComplete(values)}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white bg-primary-500 shadow-lg shadow-primary-500/30 active:scale-95 transition-transform"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}

export { BAND_COLORS, BAND_LABELS }
