import { useState } from 'react'
import { Search, X } from 'lucide-react'
import type { ExerciseMode, MuscleGroup } from '../../types/workout'
import { EXERCISES } from '../../data/exercises'
import { ExerciseDemo } from './ExerciseDemo'

const MODE_LABELS: Record<ExerciseMode, string> = {
  bodyweight: 'Körpergewicht',
  bands: 'Expander',
  chair: 'Stuhl',
}

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  brust: 'Brust',
  ruecken: 'Rücken',
  schultern: 'Schultern',
  arme: 'Arme',
  beine: 'Beine',
  gesaess: 'Gesäß',
  rumpf: 'Rumpf',
  ganzkoerper: 'Ganzkörper',
}

const ALL_MODES: ExerciseMode[] = ['bodyweight', 'bands', 'chair']
const ALL_MUSCLES: MuscleGroup[] = ['brust', 'ruecken', 'schultern', 'arme', 'beine', 'gesaess', 'rumpf']

const DIFF_COLOR = {
  leicht: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
  mittel: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
  schwer: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
}

interface ExerciseLibraryProps {
  onBack?: () => void
}

export function ExerciseLibrary({ onBack: _onBack }: ExerciseLibraryProps) {
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState<ExerciseMode | null>(null)
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = EXERCISES.filter((e) => {
    if (modeFilter && !e.modes.includes(modeFilter)) return false
    if (muscleFilter && !e.primaryMuscles.includes(muscleFilter) && !e.secondaryMuscles.includes(muscleFilter)) return false
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const selectedEx = selected ? EXERCISES.find((e) => e.id === selected) : null

  if (selectedEx) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 overflow-y-auto pb-24">
        <div className="flex items-center gap-3 px-4 pt-6 mb-4">
          <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={22} />
          </button>
          <h1 className="font-bold text-gray-900 dark:text-white text-lg">{selectedEx.name}</h1>
        </div>

        <ExerciseDemo exercise={selectedEx} className="mx-4 h-64" />

        <div className="mx-4 mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {selectedEx.modes.map((m) => (
              <span key={m} className="text-xs font-semibold bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 px-2.5 py-1 rounded-full">
                {MODE_LABELS[m]}
              </span>
            ))}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIFF_COLOR[selectedEx.difficulty]}`}>
              {selectedEx.difficulty.charAt(0).toUpperCase() + selectedEx.difficulty.slice(1)}
            </span>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Muskeln</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Primär: </span>
              {selectedEx.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
            </p>
            {selectedEx.secondaryMuscles.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                <span className="font-semibold">Sekundär: </span>
                {selectedEx.secondaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Soll: {selectedEx.target.type === 'reps'
                ? `${selectedEx.target.sets} × ${selectedEx.target.reps} Wdh.`
                : `${selectedEx.target.sets} × ${selectedEx.target.seconds}s`}
              {' · '}{selectedEx.basePoints} Punkte
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Ausführung</h3>
            <ol className="space-y-2.5">
              {selectedEx.instructions.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            {selectedEx.chairVariantNote && (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                🪑 {selectedEx.chairVariantNote}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Übung suchen…"
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-primary-300"
        />
      </div>

      {/* Mode filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setModeFilter(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            modeFilter === null
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        >
          Alle
        </button>
        {ALL_MODES.map((m) => (
          <button
            key={m}
            onClick={() => setModeFilter(modeFilter === m ? null : m)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              modeFilter === m
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Muscle filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ALL_MUSCLES.map((m) => (
          <button
            key={m}
            onClick={() => setMuscleFilter(muscleFilter === m ? null : m)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              muscleFilter === m
                ? 'bg-violet-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            {MUSCLE_LABELS[m]}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400">{filtered.length} Übungen</p>

      {/* Exercise list */}
      <div className="space-y-2">
        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setSelected(ex.id)}
            className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 flex items-center gap-3 text-left hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-800">
              <ExerciseDemo exercise={ex} className="w-full h-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ex.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {ex.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
              </p>
              <div className="flex gap-1.5 mt-1">
                {ex.modes.map((m) => (
                  <span key={m} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                    {MODE_LABELS[m]}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-primary-500">{ex.basePoints}P</p>
              <p className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 ${DIFF_COLOR[ex.difficulty]}`}>
                {ex.difficulty}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
