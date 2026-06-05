import { useState } from 'react'
import { Save } from 'lucide-react'
import type { ExerciseMode } from '../../types/workout'

const MODE_LABELS: Record<ExerciseMode, string> = {
  bodyweight: 'Körpergewicht (kein Gerät)',
  bands: 'Expander / Theraband',
  chair: 'Stuhl / Sitzend',
}

const MODE_DESCS: Record<ExerciseMode, string> = {
  bodyweight: 'Klassische Übungen ohne Equipment',
  bands: 'Mehr Widerstand für Muskelaufbau',
  chair: 'Schonend & sitzend ausführbar',
}

interface GoalSettingsProps {
  preferredMode: ExerciseMode
  targetDays: number
  targetPoints: number
  onSave: (targetDays: number, targetPoints: number, mode: ExerciseMode) => void
}

export function GoalSettings({ preferredMode, targetDays, targetPoints, onSave }: GoalSettingsProps) {
  const [mode, setMode] = useState<ExerciseMode>(preferredMode)
  const [days, setDays] = useState(targetDays)
  const [points, setPoints] = useState(targetPoints)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    onSave(days, points, mode)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const modes: ExerciseMode[] = ['bodyweight', 'bands', 'chair']

  return (
    <div className="space-y-6">
      {/* Mode */}
      <div>
        <h2 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3">Standard-Trainingsmodus</h2>
        <div className="space-y-2">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                mode === m
                  ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/30'
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                mode === m ? 'border-primary-500' : 'border-gray-300 dark:border-gray-600'
              }`}>
                {mode === m && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{MODE_LABELS[m]}</p>
                <p className="text-xs text-gray-400 mt-0.5">{MODE_DESCS[m]}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Weekly targets */}
      <div>
        <h2 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3">Wochenziel</h2>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-5">
          <div>
            <label className="flex justify-between text-sm mb-3">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Trainingstage</span>
              <span className="font-bold text-primary-500">{days} Tage</span>
            </label>
            <input
              type="range"
              min={1}
              max={7}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>1</span>
              <span>7</span>
            </div>
          </div>

          <div>
            <label className="flex justify-between text-sm mb-3">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Punkte-Ziel</span>
              <span className="font-bold text-primary-500">{points} P</span>
            </label>
            <input
              type="range"
              min={100}
              max={500}
              step={50}
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>100</span>
              <span>500</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 text-xs text-gray-500 dark:text-gray-400">
        <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">Punkte-System</p>
        <p>Leichte Übungen: 8 P · Mittelschwer: 10 P · Schwer: 12 P</p>
        <p className="mt-1">Mehrleistung bringt bis zu +100% Bonus-Punkte. Guthaben kann geschwächere Tage ausgleichen.</p>
      </div>

      <button
        onClick={handleSave}
        className={`w-full py-4 font-bold rounded-2xl text-base transition-all flex items-center justify-center gap-2 ${
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 active:scale-95'
        }`}
      >
        <Save size={18} />
        {saved ? 'Gespeichert!' : 'Einstellungen speichern'}
      </button>
    </div>
  )
}
