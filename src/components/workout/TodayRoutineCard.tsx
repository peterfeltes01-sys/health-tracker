import { Play, RefreshCw, Plus } from 'lucide-react'
import type { Exercise, ExerciseMode } from '../../types/workout'
import { estimateRoutineMinutes } from '../../utils/workout/routineBuilder'

const MODE_LABELS: Record<ExerciseMode, string> = {
  bodyweight: 'Körpergewicht',
  bands: 'Expander',
  chair: 'Stuhl',
}

const MUSCLE_LABELS: Record<string, string> = {
  brust: 'Brust', ruecken: 'Rücken', schultern: 'Schultern', arme: 'Arme',
  beine: 'Beine', gesaess: 'Gesäß', rumpf: 'Rumpf', ganzkoerper: 'Ganzkörper',
}

interface TodayRoutineCardProps {
  exercises: Exercise[]
  mode: ExerciseMode
  sessionsToday: number
  onStart: () => void
  onBonusStart: () => void
  onModeChange: (mode: ExerciseMode) => void
  onRebuild: () => void
}

export function TodayRoutineCard({
  exercises,
  mode,
  sessionsToday,
  onStart,
  onBonusStart,
  onModeChange,
  onRebuild,
}: TodayRoutineCardProps) {
  const alreadyDone = sessionsToday > 0
  const minutes = estimateRoutineMinutes(exercises)
  const modes: ExerciseMode[] = ['bodyweight', 'bands', 'chair']

  const uniqueMuscles = [...new Set(exercises.flatMap((e) => e.primaryMuscles))]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Mode switcher */}
      <div className="flex p-1.5 gap-1 bg-gray-50 dark:bg-gray-950">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === m
                ? 'bg-white dark:bg-gray-800 text-primary-500 shadow-sm'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-base">Heutige Einheit</h2>
            <p className="text-xs text-gray-400 mt-0.5">{exercises.length} Übungen · ca. {minutes} Min.</p>
          </div>
          <button onClick={onRebuild} className="p-2 text-gray-400 hover:text-primary-500 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Muscle tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {uniqueMuscles.slice(0, 5).map((m) => (
            <span key={m} className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {MUSCLE_LABELS[m] ?? m}
            </span>
          ))}
        </div>

        {/* Exercise list preview — alle Übungen sichtbar */}
        <div className="space-y-2 mb-4">
          {exercises.map((ex, i) => (
            <div key={ex.id} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-300 dark:text-gray-600 w-4 text-right flex-shrink-0">{i + 1}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{ex.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {ex.target.type === 'reps'
                  ? `${ex.target.sets}×${ex.target.reps}`
                  : `${ex.target.sets}×${ex.target.seconds}s`}
              </span>
              <span className="text-[10px] font-semibold text-primary-400 flex-shrink-0">
                {ex.basePoints}P
              </span>
            </div>
          ))}
        </div>

        {alreadyDone ? (
          <div className="space-y-2">
            <div className="w-full py-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold rounded-2xl text-sm text-center border border-emerald-100 dark:border-emerald-900">
              {sessionsToday === 1 ? 'Einheit heute abgeschlossen ✓' : `${sessionsToday} Einheiten heute ✓`}
            </div>
            <button
              onClick={onBonusStart}
              className="w-full py-3.5 bg-primary-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-primary-500/25 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Weitere Übungen
            </button>
          </div>
        ) : (
          <button
            onClick={onStart}
            className="w-full py-3.5 bg-primary-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-primary-500/25 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Play size={18} className="fill-white" />
            Training starten
          </button>
        )}
      </div>
    </div>
  )
}
